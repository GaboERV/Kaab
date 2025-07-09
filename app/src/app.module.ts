import { Module } from "@nestjs/common"
import { AuthModule } from "./auth/auth.module"
import { UsersModule } from "./users/users.module"
import { ConfigModule } from "@nestjs/config"
import { MongoDbModule } from "./mongodb/mongodb.module"
import { ConfiguracionSensoresModule } from './configuracion_sensores/configuracion_sensores.module';
import { DatosSensoresModule } from './datos_sensores/datos_sensores.module';
import { InfluxDBModule } from "./influxdb/influxdb.module"
import { RedisModule } from "./redis/redis.module"
import { MqttModule } from "./mqtt/mqtt.module"
import { obtenerEnv } from "./env/enviroment"

const { mqttUrl, redisHost, redisPort, influxUrl, influxToken, influxOrg, influxBucket } = obtenerEnv()




@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
     MqttModule.register({
      url: mqttUrl,
    }),
     RedisModule.register({
      host: redisHost,
      port: redisPort,
      // password: 'your_redis_password',
    }),
    MongoDbModule,
    AuthModule,
    UsersModule,
    ConfiguracionSensoresModule,
    DatosSensoresModule,
    InfluxDBModule.register({
      url: influxUrl,
      token: influxToken,
      org: influxOrg,
      bucket: influxBucket,
      isGlobal: true, // Optional: make it global
    }),
  ]
})
export class AppModule {}

