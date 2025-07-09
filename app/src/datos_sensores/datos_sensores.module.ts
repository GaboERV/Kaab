import { Module } from '@nestjs/common';
import { DatosSensoresService } from './datos_sensores.service';
import { DatosSensoresController } from './datos_sensores.controller';
import { MqttModule } from 'src/mqtt/mqtt.module';
import { InfluxDBModule } from 'src/influxdb/influxdb.module';
import { MqttService } from '../mqtt/mqtt.service';

@Module({
    imports: [MqttModule, InfluxDBModule],
  controllers: [DatosSensoresController],
  providers: [DatosSensoresService, MqttService],

})
export class DatosSensoresModule {}
