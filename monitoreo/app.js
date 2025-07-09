// Add these imports
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import mqtt from "mqtt";
import { createClient } from "redis";
import dotenv from 'dotenv';

dotenv.config();

const MQTT_BROKER = process.env.MQTT_BROKER || "mqtt://localhost";
const REDIS_URL = process.env.REDIS_URL || "redis://default:@localhost:6379";

const redisClient = createClient({ url: REDIS_URL });
const mqttClient = mqtt.connect(MQTT_BROKER);

const httpServer = createServer();

const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (ws) => {
  console.log('🟢 Cliente conectado a WebSocket');

  ws.on('message', (message) => {
    console.log('📩 Mensaje recibido del cliente:', message.toString());
  });
});

const WEBSOCKET_PORT = 3001;
httpServer.listen(WEBSOCKET_PORT, () => {
  console.log(`🌐 WebSocket puro escuchando en puerto ${WEBSOCKET_PORT}`);
});


mqttClient.on("connect", () => {
  console.log("📡 Conectado a Mosquitto");
  mqttClient.subscribe("kaab/colmenas");
});

async function iniciar() {
  await redisClient.connect();
  console.log("✅ Redis conectado");

  mqttClient.on("message", async (_topic, message) => {
    try {
      const data = JSON.parse(message.toString());
      let colmenaConfig = await redisClient.get(`colmena:${data.colmena_id}`);
      colmenaConfig = JSON.parse(colmenaConfig);
      console.log(`🔍 Configuración de colmena ${data.colmena_id}:`, data);
      console.log(`📥 Mensaje recibido de colmena ${data.colmena_id}:`, colmenaConfig);
      if (colmenaConfig.activo !== true) {
        console.warn(`⚠️ Colmena ${data.colmena_id} no está activa`);
        return;
      }
      await procesarColmena(data);
    } catch (err) {
      console.error("❌ Error procesando mensaje:", err.message);
    }
  });
}

async function procesarColmena(data) {
  const key = `colmena:${data.colmena_id}`;
  const configStr = await redisClient.get(key);

  if (!configStr) {
    console.warn(`⚠️ Colmena no registrada en Redis: ${data.colmena_id}`);
    return;
  }

  let parametros;
  try {
    parametros = JSON.parse(configStr);
  } catch (e) {
    console.error(`❌ Error parseando parámetros de ${key}:`, e.message);
    return;
  }

  const motivos = detectarCausas(data, parametros);
  if (motivos.length === 0) {
    console.log(`✅ Todo OK para ${data.colmena_id}`);
    return;
  }

  console.log(`🚨 Alerta: ${data.colmena_id} | Motivos: ${motivos.join(", ")}`);

  // Emit WebSocket event instead of HTTP POST
const alertData = {
  colmena_id: data.colmena_id,
  timestamp: data.timestamp,
  temperatura: data.temperatura,
  humedad: data.humedad,
  presion: data.presion,
  peso: data.peso,
  motivos,
  parametros: {
    temp_min: parametros.temp_min,
    temp_max: parametros.temp_max,
    humedad_max: parametros.humedad_max,
    humedad_min: parametros.humedad_min,
    presion_max: parametros.presion_max,
    presion_min: parametros.presion_min,
    peso_max: parametros.peso_max,
  },
};

wss.clients.forEach((client) => {
  if (client.readyState === 1) {
    client.send(JSON.stringify({ event: 'colmenaAlert', data: alertData }));
  }
});

}

function detectarCausas(data, config) {
  const causas = [];
  const p = config.parametros;

  if (data.temperatura < p.temp_min) causas.push("temperatura_baja");
  if (data.temperatura > p.temp_max) causas.push("temperatura_alta");
  if (data.humedad > p.humedad_max) causas.push("humedad_alta");
  if (data.humedad < p.humedad_min) causas.push("humedad_baja");
  if (data.presion > p.presion_max) causas.push("presion_alta");
  if (data.presion < p.presion_min) causas.push("presion_baja");
  if (data.peso > p.peso_max) causas.push("peso_excesivo");

  return causas;
}

iniciar().catch((err) => console.error("❌ Error general:", err));