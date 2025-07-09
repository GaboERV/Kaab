// src/redis/redis.module.ts
import { Module, DynamicModule, Provider } from '@nestjs/common';
import Redis from 'ioredis';

interface RedisModuleOptions {
  host: string;
  port: number;
  password?: string;
}

const REDIS_MODULE_OPTIONS = 'REDIS_MODULE_OPTIONS';
const REDIS_CLIENT = 'REDIS_CLIENT';

@Module({})
export class RedisModule {
  static register(options: RedisModuleOptions): DynamicModule {
    const redisClientProvider: Provider = {
      provide: REDIS_CLIENT,
      useFactory: async () => {
        const client = new Redis(options);
        client.on('connect', () => console.log('Connected to Redis!'));
        client.on('error', (err) => console.error('Redis connection error:', err));
        return client;
      },
    };

    const optionsProvider: Provider = {
      provide: REDIS_MODULE_OPTIONS,
      useValue: options,
    };

    return {
      module: RedisModule,
      providers: [redisClientProvider, optionsProvider],
      exports: [REDIS_CLIENT],
      global: true, // Make the module global if needed
    };
  }
}