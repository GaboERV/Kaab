import { ConfigService } from "@nestjs/config";

export function obtenerEnv() {
  const mqttUrl = new ConfigService().get<string>('MQTT_URL', '')
  const redisHost = new ConfigService().get<string>('REDIS_HOST', '')
  const redisPort = parseInt(new ConfigService().get<string>('REDIS_PORT', '6379'), 10)
  const influxToken = new ConfigService().get<string>('INFLUXDB_TOKEN', '')
  const influxUrl = new ConfigService().get<string>('INFLUXDB_URL', 'http://localhost:8086')
  const influxOrg = new ConfigService().get<string>('INFLUXDB_ORG', '')
  const influxBucket = new ConfigService().get<string>('INFLUXDB_BUCKET', '')
  return { mqttUrl, redisHost, redisPort, influxUrl, influxToken, influxOrg, influxBucket }
}
