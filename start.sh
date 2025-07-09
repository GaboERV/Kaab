#!/bin/bash

set -e  # Salir inmediatamente si un comando falla

# === Colores ===
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # Sin color

echo -e "${YELLOW}🔍 Verificando archivo .env...${NC}"
if [ ! -f .env ]; then
  echo -e "${RED}❌ Archivo .env no encontrado. Crea uno antes de continuar.${NC}"
  exit 1
fi

echo -e "${YELLOW}📦 Cargando variables de entorno...${NC}"
export $(grep -v '^#' .env | xargs)

echo -e "${YELLOW}🧹 Deteniendo y eliminando contenedores y redes huérfanas anteriores...${NC}"
docker compose down --remove-orphans || true

echo -e "${YELLOW}🔧 Verificando si la red 'kaab_default' necesita recrearse...${NC}"
if docker network inspect kaab_default >/dev/null 2>&1; then
  docker network rm kaab_default >/dev/null 2>&1 && \
  echo -e "${GREEN}🔁 Red 'kaab_default' eliminada para evitar conflictos de configuración.${NC}"
fi

echo -e "${YELLOW}🚧 Reconstruyendo imágenes y levantando servicios...${NC}"
docker compose up -d --build

echo -e "${YELLOW}⏳ Esperando 3 segundos a que todos los servicios arranquen...${NC}"
sleep 3

echo -e "${YELLOW}⚙️ Ejecutando tarea de inicialización (init)...${NC}"
if docker compose run --rm init; then
  echo -e "${GREEN}✅ Init ejecutado correctamente.${NC}"
else
  echo -e "${RED}❌ Ocurrió un error ejecutando el servicio init.${NC}"
  echo -e "${YELLOW}🔍 Revisa los logs con: docker-compose logs init${NC}"
  exit 1
fi

echo -e "${GREEN}🎉 Todos los servicios están arriba y listos.${NC}"
