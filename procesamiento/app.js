import { connect } from "mqtt";
import { MongoClient } from "mongodb";
import { InfluxDB, Point } from "@influxdata/influxdb-client";
import { createClient } from "redis";
import dotenv from "dotenv";
import Queue from "bull"; // Import the BullMQ library

dotenv.config();

const MQTT_BROKER = process.env.MQTT_BROKER || "";
const MONGO_URL = process.env.MONGO_URL || "";
const INFLUX_URL = process.env.INFLUX_URL || "";
const INFLUX_TOKEN = process.env.INFLUX_TOKEN || "";
const ORG = process.env.ORG || "";
const BUCKET = process.env.BUCKET || "";
const REDIS_URL = process.env.REDIS_URL || "";
const MONGODB_NAME = process.env.MONGODB_NAME || "";

console.log(INFLUX_URL, INFLUX_TOKEN, ORG, BUCKET);

const influx = new InfluxDB({ url: INFLUX_URL, token: INFLUX_TOKEN });
const writeApi = influx.getWriteApi(ORG, BUCKET, "s");

const mongoClient = new MongoClient(MONGO_URL);
const redisClient = createClient({
  url: REDIS_URL,
});

redisClient
  .connect()
  .then(() => console.log("✅ Conectado a Redis remoto"))
  .catch(console.error);

const mqttClient = connect(MQTT_BROKER);

// --- Initialize BullMQ Queue ---
const dataQueue = new Queue("data-processing", REDIS_URL); // 'data-processing' is the queue name

// --- Function to add data to the queue ---
async function addDataToQueue(data) {
  await dataQueue.add("process-data", data);
}

// --- Function to process data from the queue ---
async function processData(job) {
  const { colmena_id, temperatura, humedad, presion, peso, timestamp } =
    job.data;

  try {
    // Obtener los datos de la colmena desde Redis o MongoDB
    const colmena = await obtenerColmena(colmena_id);

    if (!colmena) {
      console.error(`❌ Colmena ${colmena_id} no encontrada.`);
      return;
    }

    if (!colmena.activo) {
      console.warn(`❌ Colmena ${colmena_id} no está activa.`);
      return;
    }

    console.log(
      "ℹ️  Valor de 'temperatura' antes de floatField():",
      temperatura
    );
    console.log("ℹ️  Valor de 'humedad' antes de floatField():", humedad);
    console.log("ℹ️  Valor de 'presion' antes de floatField():", presion);
    console.log("ℹ️  Valor de 'peso' antes de floatField():", peso);

    const point = new Point("lecturas_colmena")
      .tag("colmena_id", colmena_id)
      .floatField("temperatura", parseFloat(temperatura))
      .floatField("humedad", parseFloat(humedad))
      .floatField("presion", parseFloat(presion))
      .floatField("peso", parseFloat(peso))
      .timestamp(new Date(timestamp * 1000));

    console.log("ℹ️  Punto InfluxDB creado:", point);

    writeApi.writePoint(point);

    console.log(`✅ Dato insertado: ${colmena_id}`);
  } catch (err) {
    console.error("❌ Error al procesar mensaje:", err.message);
  }
}

// --- Process messages from the queue using a worker ---
dataQueue.process("process-data", async (job) => {
  await processData(job);
});

// --- Función para cargar todos los sensores a Redis ---
async function cargarSensoresCache() {
  await mongoClient.connect();

  const db = mongoClient.db(MONGODB_NAME);
  const colmenas = db.collection("colmenas");

  const sensores = await colmenas.find().toArray();
  for (const sensor of sensores) {
    await redisClient.set(
      `colmena:${sensor.colmena_id}`,
      JSON.stringify(sensor)
    );
  }

  console.log(`🔁 Sensores cargados a Redis: ${sensores.length}`);
}

// --- Función para obtener los datos de la colmena desde Redis o MongoDB ---
async function obtenerColmena(colmena_id) {
  try {
    let colmenaData = await redisClient.get(`colmena:${colmena_id}`);

    if (!colmenaData) {
      console.log(
        `Colmena ${colmena_id} no encontrada en Redis, consultando MongoDB...`
      );
      const db = mongoClient.db(MONGODB_NAME);
      const colmenas = db.collection("colmenas");
      const colmena = await colmenas.findOne({ colmena_id });

      if (colmena) {
        await redisClient.set(
          `colmena:${colmena_id}`,
          JSON.stringify(colmena)
        );
        console.log(
          `Colmena ${colmena_id} cargada desde MongoDB y cacheada en Redis.`
        );
        return colmena;
      } else {
        crearNuevaColmena(colmena_id, `colmena ${colmena_id}`);
      }
    }

    return JSON.parse(colmenaData);
  } catch (error) {
    console.error(`❌ Error al obtener la colmena ${colmena_id}:`, error);
    return null;
  }
}

// --- Función para invalidar la caché de una colmena ---
async function invalidarCacheColmena(colmena_id) {
  try {
    await redisClient.del(`colmena:${colmena_id}`);
    console.log(`🗑️  Cache de colmena ${colmena_id} invalidada.`);
  } catch (error) {
    console.error(
      `❌ Error al invalidar la cache de la colmena ${colmena_id}:`,
      error
    );
  }
}

// --- INICIO ---
mqttClient.on("connect", async () => {
  console.log("✅ Conectado a Mosquitto");
  mqttClient.subscribe("kaab/colmenas");

  // Cargar cache
  await cargarSensoresCache();
});

// --- PROCESAMIENTO DE MENSAJES ---
mqttClient.on("message", async (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    console.log("ℹ️  Objeto 'data' después de JSON.parse():", data);

    // Add data to the queue for processing
    await addDataToQueue(data);
  } catch (err) {
    console.error("❌ Error al procesar mensaje:", err.message);
  }
});

// --- Función para crear una nueva colmena (Ejemplo) ---
async function crearNuevaColmena(colmena_id, nombre) {
  try {
    const db = mongoClient.db(MONGODB_NAME);
    const colmenas = db.collection("colmenas");

    const nuevaColmena = {
      colmena_id: colmena_id,
      nombre: nombre,
      parametros: {
        temp_max: 35,
        temp_min: 15,
        humedad_min: 30,
        humedad_max: 80,
        presion_min: 950,
        presion_max: 1050,
        peso_max: 50,
      },
      activo: true,
      descripcion: "",
      fecha_registro: new Date(),
    };

    await colmenas.insertOne(nuevaColmena);

    // Cargar la nueva colmena en la cache
    await redisClient.set(
      `colmena:${colmena_id}`,
      JSON.stringify(nuevaColmena)
    );

    console.log(`🆕 Nueva colmena registrada y cacheada: ${colmena_id}`);
  } catch (error) {
    console.error(`❌ Error al crear la nueva colmena ${colmena_id}:`, error);
  }
}

// --- Función para actualizar el estado de una colmena (Ejemplo) ---
async function actualizarEstadoColmena(colmena_id, nuevoEstado) {
  try {
    const db = mongoClient.db(MONGODB_NAME);
    const colmenas = db.collection("colmenas");

    await colmenas.updateOne(
      { colmena_id: colmena_id },
      { $set: { activo: nuevoEstado } }
    );

    // Invalidar la caché
    await invalidarCacheColmena(colmena_id);

    console.log(`✅ Colmena ${colmena_id} actualizada y caché invalidada.`);
  } catch (error) {
    console.error(
      `❌ Error al actualizar el estado de la colmena ${colmena_id}:`,
      error
    );
  }
}

// --- EJEMPLOS DE USO (puedes descomentarlos para probar) ---
// setTimeout(async () => {
//   await crearNuevaColmena("colmena123", "Colmena de prueba");
//   await actualizarEstadoColmena("colmena123", false);
// }, 5000);