// src/influxdb/influxdb.module.ts
import { Module, DynamicModule, Provider } from '@nestjs/common';
import { InfluxDB } from '@influxdata/influxdb-client';
import { InfluxDBService } from './influxdb.service';
import { InfluxDBModuleOptions } from './interfaces/influxdb-module-options.interface';
import { INFLUXDB_MODULE_OPTIONS } from './constants'

@Module({})
export class InfluxDBModule {
  static register(options: InfluxDBModuleOptions): DynamicModule {
    const influxDbProvider: Provider = {
      provide: InfluxDB,
      useFactory: () => {
        return new InfluxDB({
          url: options.url,
          token: options.token,
        });
      },
    };

    const optionsProvider: Provider = {
      provide: INFLUXDB_MODULE_OPTIONS,
      useValue: options,
    };

    return {
      module: InfluxDBModule,
      providers: [influxDbProvider, optionsProvider, InfluxDBService],
      exports: [InfluxDBService],
      global: options.isGlobal || false, // Make module global if specified
    };
  }
}