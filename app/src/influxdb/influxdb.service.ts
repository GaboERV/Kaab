// src/influxdb/influxdb.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { InfluxDB, Point, QueryApi } from '@influxdata/influxdb-client';
import { InfluxDBModuleOptions } from './interfaces/influxdb-module-options.interface';
import { INFLUXDB_MODULE_OPTIONS } from './constants';

@Injectable()
export class InfluxDBService {
  private readonly influxDB: InfluxDB;
  private readonly org: string;
  private readonly bucket: string;

  constructor(
    @Inject(INFLUXDB_MODULE_OPTIONS)
    private readonly options: InfluxDBModuleOptions,
  ) {
    this.influxDB = new InfluxDB({
      url: this.options.url,
      token: this.options.token,
    });
    this.org = options.org;
    this.bucket = options.bucket;
  }

  async writePoint(measurement: string, fields: { [key: string]: number | string | boolean }, tags?: { [key: string]: string }) {
    const writeApi = this.influxDB.getWriteApi(this.org, this.bucket);

    try {
      const point = new Point(measurement);

      for (const tag in tags) {
        if (tags.hasOwnProperty(tag)) {
          point.tag(tag, tags[tag]);
        }
      }

      for (const field in fields) {
        if (fields.hasOwnProperty(field)) {
          const value = fields[field];
          if (typeof value === 'number') {
            point.floatField(field, value);
          } else if (typeof value === 'string') {
            point.stringField(field, value);
          } else if (typeof value === 'boolean') {
            point.booleanField(field, value);
          }
        }
      }

      writeApi.writePoint(point);
      await writeApi.flush();
    } catch (error) {
      console.error('Error writing to InfluxDB:', error);
      throw error;
    } finally {
      await writeApi.close();
    }
  }

  async queryData(fluxQuery: string): Promise<any[]> {
    const queryApi = this.influxDB.getQueryApi(this.org);
    try {
      const data: any[] = [];
      await new Promise<void>((resolve, reject) => {
        queryApi.queryRows(fluxQuery, {
          next: (row, tableMeta) => {
            try {
              const o = tableMeta.toObject(row);
              data.push(o); // Push the entire object
            } catch (err) {
              console.error("Error processing row:", err); // Log row-specific errors
              reject(err); // Reject the promise if a row cannot be processed
            }
          },
          error: (error) => {
            console.error('Error querying InfluxDB:', error);
            reject(error);
          },
          complete: () => {
            console.log('Query completed successfully.');
            resolve();
          },
        });
      });
      return data;
    } catch (error) {
      console.error('Error querying InfluxDB:', error);
      throw error;
    }
  }

  // Example function to get the last value of a specific measurement
  async getLastValue(measurement: string, field: string): Promise<any> {
    const fluxQuery = `
      from(bucket: "${this.bucket}")
      |> range(start: -1h)
      |> filter(fn: (r) => r._measurement == "${measurement}")
      |> filter(fn: (r) => r._field == "${field}")
      |> last()
    `;

    const results = await this.queryData(fluxQuery);
    return results.length > 0 ? results[0]._value : null;
  }
}