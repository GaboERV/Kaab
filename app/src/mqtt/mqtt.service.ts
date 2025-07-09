// src/mqtt/mqtt.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { MqttClient } from 'mqtt';

const MQTT_CLIENT = 'MQTT_CLIENT';

@Injectable()
export class MqttService {
  constructor(@Inject(MQTT_CLIENT) private readonly mqttClient: MqttClient) {}

  async subscribe(topic: string, callback: (topic: string, message: Buffer) => void): Promise<void> {
    this.mqttClient.subscribe(topic, (err) => {
      if (err) {
        console.error(`Error subscribing to topic ${topic}:`, err);
      } else {
        console.log(`Subscribed to topic ${topic}`);
      }
    });

    this.mqttClient.on('message', (receivedTopic, message) => {
      if (receivedTopic === topic) {
        callback(receivedTopic, message);
      }
    });
  }

  async publish(topic: string, message: string): Promise<void> {
    this.mqttClient.publish(topic, message);
  }
}