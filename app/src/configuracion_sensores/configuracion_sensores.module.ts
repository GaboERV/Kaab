import { Module } from '@nestjs/common';
import { ConfiguracionSensoresService } from './configuracion_sensores.service';
import { ConfiguracionSensoresController } from './configuracion_sensores.controller';
import { MongoDbModule } from 'src/mongodb/mongodb.module';
import { RedisService } from 'src/redis/redis.service';

@Module({
  imports: [MongoDbModule],
  controllers: [ConfiguracionSensoresController],
  providers: [ConfiguracionSensoresService,RedisService],
})
export class ConfiguracionSensoresModule {}
