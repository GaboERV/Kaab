// src/mqtt/mqtt.module.ts
import { Module, DynamicModule, Provider } from '@nestjs/common';
import * as mqtt from 'mqtt';

interface MqttModuleOptions {
  url: string;
  clientId?: string;
  username?: string;
  password?: string;
}

const MQTT_MODULE_OPTIONS = 'MQTT_MODULE_OPTIONS';
const MQTT_CLIENT = 'MQTT_CLIENT';

@Module({})
export class MqttModule {
  static register(options: MqttModuleOptions): DynamicModule {
    const mqttClientProvider: Provider = {
      provide: MQTT_CLIENT,
      useFactory: () => {
        const client = mqtt.connect(options.url, {
          clientId: options.clientId || `mqtt_${Math.random().toString(16).slice(3)}`, // Generate a random clientId if not provided
          username: options.username,
          password: options.password,
          clean: true, // Recommended: ensures a clean session
        });

        client.on('connect', () => {
          console.log('Connected to MQTT broker!');
        });

        client.on('error', (err) => {
          console.error('MQTT connection error:', err);
        });

        return client;
      },
    };

    const optionsProvider: Provider = {
      provide: MQTT_MODULE_OPTIONS,
      useValue: options,
    };

    return {
      module: MqttModule,
      providers: [mqttClientProvider, optionsProvider],
      exports: [MQTT_CLIENT],
      global: true, // Make the module global if needed
    };
  }
}