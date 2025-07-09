# 🐝 Proyecto Kaab

Sistema basado en microservicios para la gestión y monitoreo de colmenas de abejas, desplegado con Docker y construido con Node.js y NestJS. Utiliza InfluxDB para series temporales, MongoDB para datos persistentes, Redis para caché y Mosquitto (MQTT) para comunicación en tiempo real.

---

## 🏗️ Arquitectura General

| Servicio                | Funcionalidad                                                                                  |
|-------------------------|-----------------------------------------------------------------------------------------------|
| **App Service**         | Autenticación, gestión de usuarios, configuración, API REST .         |
| **Monitoreo Service**   | Escucha MQTT, valida datos, detecta anomalías y envía alertas en tiempo real atraves de Websockets.                 |
| **Procesamiento Service** | Procesa datos MQTT, almacena en InfluxDB, crea colmenas en MongoDB si no existen.           |
| **Init Service**     | Creacion de administrador y actualizacion de datos del administrador. |
| **Infraestructura**     | InfluxDB (series temporales), MongoDB (persistencia), Redis (caché), Mosquitto (MQTT broker). |

---

## 🚀 Tecnologías Principales

- **Node.js** + **NestJS**
- **Docker** & **Docker Compose**
- **MongoDB**
- **InfluxDB**
- **Redis**
- **Mosquitto** (MQTT broker)
- **WebSocket** (alertas en tiempo real)

---

## ⚙️ Requisitos Previos

- Docker y Docker Compose instalados
- Puerto **8086** libre (InfluxDB)
- Puerto **1883** libre (Mosquitto)
- Puertos expuestos según `docker-compose.yml`

---

## 📁 Estructura del Proyecto

```
/
├── app/               # Servicio principal (auth, usuarios, API, WebSocket)
├── init/              # Inicializacion y creacion de super usuario
├── monitoreo/         # Monitoreo y validación de datos MQTT
├── procesamiento/     # Procesamiento de datos MQTT → InfluxDB y Mongo
├── mosquitto/         # Broker MQTT
├── tasks/             # Tareas programadas esenciales para el funcionamiento de la app
├── docker-compose.yml # Orquestación de contenedores
├── .env.example       # Variables de entorno de ejemplo
├── start.sh           # permite la inicializacion automatica de todos los contenedores
└── README.md          # Documentación
```

---

## 🔑 Variables de Entorno (`.env.example`)

```env
# === General ===
PASSWORD=your_password_here
JWT_SECRET=your_jwt_secret_here

# === MongoDB ===
MONGO_INITDB_ROOT_USERNAME=root
MONGO_INITDB_ROOT_PASSWORD=${PASSWORD}
MONGO_URL=mongodb://${MONGO_INITDB_ROOT_USERNAME}:${MONGO_INITDB_ROOT_PASSWORD}@mongo:27017
MONGODB_NAME=kaab
DATABASE_URL=mongodb://mongo:27017/${MONGODB_NAME}?retryWrites=true&w=majority

# === Redis ===
REDIS_URL=redis://redis:6379
REDIS_HOST=redis
REDIS_PORT=6379

# === InfluxDB ===
DOCKER_INFLUXDB_INIT_MODE=setup
DOCKER_INFLUXDB_INIT_USERNAME=admin
DOCKER_INFLUXDB_INIT_PASSWORD=${PASSWORD}
DOCKER_INFLUXDB_INIT_ORG=your_org_name
DOCKER_INFLUXDB_INIT_BUCKET=your_bucket_name
INFLUXDB_TOKEN=your_influxdb_token_here
INFLUXDB_URL=http://influxdb:8086
INFLUXDB_ORG=${DOCKER_INFLUXDB_INIT_ORG}
INFLUXDB_BUCKET=${DOCKER_INFLUXDB_INIT_BUCKET}

# === MQTT ===
MQTT_BROKER=mqtt://mosquitto:1883
MQTT_URL=${MQTT_BROKER}
```

## 🐳 Despliegue Rápido

1. **Clona el repositorio:**
    ```bash
    git clone https://github.com/GaboERV/Kaab.git
    cd Kaab
    ```

2. **Configura variables de entorno:**
    ```bash
    cp .env.example .env
    # Edita el archivo .env con tus configuraciones
    ```

3. **Construye y levanta los contenedores:**
    ```bash
    docker-compose up --build -d
    ```

4. **Ver logs de servicios:**
    ```bash
    docker-compose logs -f app
    docker-compose logs -f monitoreo
    docker-compose logs -f procesamiento
    ```

---

## 📡 Endpoints Principales

### App Service

- `POST /auth/login` — Autenticación de usuario
- `POST /users` — Registro de usuario
- `GET /users` — Obtener todos los usuarios
- `GET /users/${id}` — Obtener los datos de un usuario
- `PATCH /users/${id}`— Actualizacion de usuario
- `DELETE /users/${id}` — Eliminar a un usuario
- `GET /configuracion-colmenas/${id}` — Obtener configuración de colmena por su id (MongoDB)
- `PATCH /configuracion-colmenas/${id}` — Actualizar la configuración de una colmena (MongoDB)
- `GET /dato-colmena/historico-colmena` — Datos históricos promediados
- `GET /dato-colmena/ultimo-dato-colmena` — Obtener el último dato de todas las colmenas

> **Nota:** Se implementa Swagger para probar y documentar las APIs de manera interactiva. Accede a la documentación en `/api` cuando el servicio esté en ejecución.

### WebSocket para Alertas

- Expuesto en el puerto `3001` para alertas en tiempo real ante anomalías detectadas.

---

## 🔄 Flujo de Datos

1. **Sensores** publican datos vía MQTT al broker Mosquitto.
2. **Monitoreo Service** escucha MQTT, valida datos y detecta anomalías.
3. Si hay anomalías, **Monitoreo** envía alertas en tiempo real al **App Service** vía WebSocket.
4. **Procesamiento Service** procesa datos MQTT y los almacena en InfluxDB.
5. Si la colmena no existe en MongoDB, **Procesamiento** la crea automáticamente.

---

## 📝 Notas Adicionales

- Sistema escalable y extensible.
- Redis para caché y sesiones.
- Seguridad basada en JWT en el App Service.

---

## 📬 Contacto

 gabrie5887@gmail.com

