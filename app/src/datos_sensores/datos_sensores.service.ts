import { Injectable, Logger } from '@nestjs/common';

import { ColmenasParametros } from './interface/colemena.interface';
import { InfluxDBService } from 'src/influxdb/influxdb.service';
import { ParametrosBusqueda } from './dto/Parametros_busqueda.dto';
import { MqttService } from 'src/mqtt/mqtt.service';
import { ConfigService } from '@nestjs/config';

const BUCKET = new ConfigService().get<string>('INFLUXDB_BUCKET') || ''; // Default to 'colmena' if not set
@Injectable()
export class DatosSensoresService {
  constructor(
    private readonly influxDBService: InfluxDBService,
    private readonly mqttService: MqttService,
  
  ) {}
  private readonly logger = new Logger(DatosSensoresService.name);
  private readonly mqttTopic = 'kaab/colmenas'; // Replace with your MQTT topic
  private colmenasData: ColmenasParametros[] = [];


  async onModuleInit() {
    this.logger.log(`Subscribing to MQTT topic: ${this.mqttTopic}`);

    await this.mqttService.subscribe(this.mqttTopic, (topic: string, message: Buffer) => {
      try {
        const payloadString = message.toString();
        const payload: ColmenasParametros = JSON.parse(payloadString); // Parse MQTT payload

        this.logger.debug(`Received MQTT message on topic ${topic}: ${payloadString}`);

        const existingColmenaIndex = this.colmenasData.findIndex(colmena => colmena.colmena_id === payload.colmena_id);

        if (existingColmenaIndex !== -1) {
          // Update existing colmena data
          this.colmenasData[existingColmenaIndex] = {
            
            colmena_id: payload.colmena_id,
            temperatura: payload.temperatura,
            humedad: payload.humedad,
            presion: payload.presion,
            peso: payload.peso,
            timestamp: payload.timestamp
          };
        } else {
          // Add new colmena data to the array
          this.colmenasData.push({

            colmena_id: payload.colmena_id,
            temperatura: payload.temperatura,
            humedad: payload.humedad,
            presion: payload.presion,
            peso: payload.peso,
            timestamp: payload.timestamp
          });
        }

        this.logger.log(`Updated colmenasData: ${JSON.stringify(this.colmenasData)}`);
      } catch (error) {
        this.logger.error('Error processing MQTT message:', error);
      }
    });
  }


  async obtenerHistoricoColmena(
    ParametrosBusqueda: ParametrosBusqueda,
  ): Promise<ColmenasParametros[] | undefined> {
    const { colmenaId, tiempoBusqueda, intervalo } = ParametrosBusqueda;
    console.log('Parametros de busqueda:', ParametrosBusqueda);

    let fluxQuery = '';

    if (tiempoBusqueda == null) {
      // Si `dias` es null o undefined → obtener solo el último dato
      fluxQuery = `
    from(bucket: "${BUCKET}")
      |> range(start:0)  // Obligatorio: range amplio (30 días arbitrario)
      |> filter(fn: (r) => r["_measurement"] == "promedios_colmena_${intervalo}")
      |> filter(fn: (r) => r["colmena_id"] == "${colmenaId}")
      |> last()
      |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
      |> map(fn: (r) => ({ r with _time: int(v: int(v: r._time) / 1000000000) }))
      |> yield(name: "last")
  `;
    } else {
      // Si `dias` tiene valor → traer datos dentro del rango
      fluxQuery = `
    from(bucket: "${BUCKET}")
      |> range(start: -${tiempoBusqueda}) 
      |> filter(fn: (r) => r["_measurement"] == "promedios_colmena_${intervalo}")
      |> filter(fn: (r) => r["colmena_id"] == "${colmenaId}")
      |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
      |> map(fn: (r) => ({ r with _time: int(v: int(v: r._time) / 1000000000) }))
      |> yield(name: "mean")
  `;
    }

    console.log('Flux query generado:', fluxQuery);

    let resultado = await this.influxDBService.queryData(fluxQuery); //Pass the org to the query

    // Remove this, the result of queryData should already be an array
    // if (typeof resultado === 'string') {
    //   resultado = JSON.parse(resultado);
    // }
    console.log('Resultado de la consulta:', resultado);

    if (!resultado || resultado.length === 0) {
      return undefined;
    }

    const transformedData: ColmenasParametros[] = resultado.map((item) => {
      return {
        temperatura: item.temperatura || 0, // Handle potential null/undefined
        humedad: item.humedad || 0,
        presion: item.presion || 0,
        peso: item.peso || 0,
        timestamp: item._time || 0, // Convert to Unix timestamp (seconds), default to 0 if missing
      };
    });

    console.log('Transformed Data:', transformedData);

    return transformedData;
  }
   getAllColmenasData(): ColmenasParametros[] {
    return this.colmenasData;
  }
  getColmenaDataById(colmenaId: string): ColmenasParametros | undefined {
    return this.colmenasData.find(colmena => colmena.colmena_id === colmenaId);
  }
}
