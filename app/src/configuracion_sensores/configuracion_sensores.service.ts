// src/configuracion_sensores/configuracion_sensores.service.ts
import { Injectable } from '@nestjs/common';
import { MongoDbService } from 'src/mongodb/mongodb.service';
import { RedisService } from 'src/redis/redis.service';

@Injectable()

export class ConfiguracionSensoresService {
  constructor(
    private readonly mongoDbService: MongoDbService,
    private readonly redisService: RedisService,
  ) {}

  async get(id: string): Promise<any> {
    if (!id) {
      throw new Error(
        'No se proporcionó un ID para buscar la configuración del sensor',
      );
    }

    const configuracion = await this.mongoDbService
      .getCollection('colmenas')
      .findOne({ colmena_id: id }); // Query by _id (string)
    if (!configuracion) {
      throw new Error('No se encontró la configuración del sensor');
    }
    return configuracion;
  }
  async getAll(): Promise<any[]> {
  const configuraciones = await this.mongoDbService
    .getCollection('colmenas')
    .find({})
    .toArray();

  return configuraciones;
}


  async update(id: string, updateData: any): Promise<any> {
    if (!id) {
      throw new Error(
        'No se proporcionó un ID para actualizar la configuración del sensor',
      );
    }

    if (!updateData) {
      throw new Error(
        'No se proporcionaron datos para actualizar la configuración del sensor',
      );
    }

    try {
      const result = await this.mongoDbService
        .getCollection('colmenas')
        .updateOne(
          { colmena_id: id }, // Query by colmena_id (string)
          { $set: updateData },
        );

      if (result.matchedCount === 0) {
        throw new Error(
          'No se encontró la configuración del sensor para actualizar',
        );
      }
      this.redisService.setValue(`colmena:${id}`, JSON.stringify(updateData));
      return { success: true };
    } catch (error) {
      throw new Error(
        `Error al actualizar la configuración del sensor: ${error.message}`,
      );
    }
  }
}
