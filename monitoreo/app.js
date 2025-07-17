// Add these imports
import { createServer } from "http";
import { WebSocketServer } from "ws";
import mqtt from "mqtt";
import { createClient } from "redis";
import dotenv from "dotenv";
import cors from "cors";
import express from "express";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const MQTT_BROKER = process.env.MQTT_BROKER || "mqtt://localhost";
const REDIS_URL = process.env.REDIS_URL || "redis://default:@localhost:6379";

const redisClient = createClient({ url: REDIS_URL });
const mqttClient = mqtt.connect(MQTT_BROKER);

const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer });

// (Se ha eliminado la ruta POST /auth/update-push-token)

wss.on("connection", (ws) => {
  console.log("🟢 Cliente conectado a WebSocket");

  ws.on("message", (message) => {
    console.log("📩 Mensaje recibido del cliente:", message.toString());
  });

  ws.on("close", () => {
    console.log("🔴 Cliente desconectado de WebSocket");
  });
});

const WEBSOCKET_PORT = process.env.PORT || 3001;
httpServer.listen(WEBSOCKET_PORT, () => {
  console.log(`🌐 Servidor WebSocket escuchando en puerto ${WEBSOCKET_PORT}`);
});

mqttClient.on("connect", () => {
  console.log("📡 Conectado a Mosquitto MQTT Broker");
  // Suscribirse al tópico general de las colmenas
  mqttClient.subscribe("kaab/colmenas");
});

async function iniciar() {
  await redisClient.connect();
  console.log("✅ Redis conectado");

  mqttClient.on("message", async (_topic, message) => {
    try {
      const data = JSON.parse(message.toString());

      // Validar que el mensaje tenga un colmena_id
      if (!data.colmena_id) {
        console.warn("⚠️ Mensaje MQTT recibido sin colmena_id:", data);
        return;
      }
      
      let colmenaConfigStr = await redisClient.get(`colmena:${data.colmena_id}`);
      
      if (!colmenaConfigStr) {
        console.warn(`⚠️ No se encontró configuración para la colmena ${data.colmena_id}`);
        return;
      }
      
      const colmenaConfig = JSON.parse(colmenaConfigStr);

      console.log(`📥 Mensaje recibido de colmena ${data.colmena_id}:`, data);
      
      if (colmenaConfig.activo !== true) {
        console.log(`ℹ️ Colmena ${data.colmena_id} no está activa, se ignora el mensaje.`);
        return;
      }

      // Procesar los datos de la colmena para detectar alertas
      await procesarColmena(data, colmenaConfig);
    } catch (err) {
      console.error("❌ Error procesando mensaje MQTT:", err.message);
    }
  });
}

// Objeto para almacenar el último timestamp de alerta por colmena para el cooldown
const lastAlertTimes = {};
const COOLDOWN_SECONDS = 60; // 1 minuto de espera entre alertas por colmena

async function procesarColmena(data, config) {
  const motivos = detectarCausas(data, config);

  // Si no hay motivos de alerta, todo está bien
  if (motivos.length === 0) {
    console.log(`✅ Todo OK para la colmena ${data.colmena_id}`);
    return;
  }

  console.log(`🚨 ¡ALERTA! Colmena: ${data.colmena_id} | Motivos: ${motivos.join(", ")}`);

  // Lógica de Cooldown para no saturar con alertas
  const now = Date.now();
  const lastAlertTime = lastAlertTimes[data.colmena_id] || 0;
  const timeSinceLastAlert = now - lastAlertTime;

  if (timeSinceLastAlert < COOLDOWN_SECONDS * 1000) {
    const timeLeft = (COOLDOWN_SECONDS * 1000 - timeSinceLastAlert) / 1000;
    console.log(
      `⏱️ Cooldown activo para colmena ${data.colmena_id}. Próxima alerta permitida en ${timeLeft.toFixed(1)} segundos.`
    );
    return; // No enviar la alerta si está en cooldown
  }

  // Crear el objeto de datos de la alerta
  const alertData = {
    colmena_id: data.colmena_id,
    timestamp: data.timestamp,
    temperatura: data.temperatura,
    humedad: data.humedad,
    presion: data.presion,
    peso: data.peso,
    motivos,
  };

  // Enviar el evento de alerta a TODOS los clientes WebSocket conectados
  console.log(`📢 Enviando alerta a ${wss.clients.size} cliente(s) WebSocket...`);
  wss.clients.forEach((client) => {
    // Verificar que el cliente esté en estado "OPEN" (listo para recibir mensajes)
    if (client.readyState === 1) { // 1 es WebSocket.OPEN
      client.send(JSON.stringify({ event: "colmenaAlert", data: alertData }));
    }
  });

  // Actualizar el tiempo de la última alerta para esta colmena
  lastAlertTimes[data.colmena_id] = now;
}

function detectarCausas(data, config) {
  const causas = [];
  const p = config.parametros;

  // Validaciones para asegurar que los datos existen antes de comparar
  if (typeof data.temperatura === 'number' && data.temperatura < p.temp_min) causas.push("temperatura_baja");
  if (typeof data.temperatura === 'number' && data.temperatura > p.temp_max) causas.push("temperatura_alta");
  if (typeof data.humedad === 'number' && data.humedad > p.humedad_max) causas.push("humedad_alta");
  if (typeof data.humedad === 'number' && data.humedad < p.humedad_min) causas.push("humedad_baja");
  if (typeof data.presion === 'number' && data.presion > p.presion_max) causas.push("presion_alta");
  if (typeof data.presion === 'number' && data.presion < p.presion_min) causas.push("presion_baja");
  if (typeof data.peso === 'number' && data.peso > p.peso_max) causas.push("peso_excesivo");

  return causas;
}

// Iniciar el servidor
iniciar().catch((err) => console.error("❌ Error fatal al iniciar el servidor:", err));