FROM node:20

# Establece el directorio de trabajo
WORKDIR /home/app

# Copia solo los archivos necesarios para instalar dependencias
COPY package*.json ./

# Instala dependencias sin devDependencies (ideal para producción)
RUN npm ci

# Copia el resto del código
COPY . .

# Comando para producción
CMD ["node", "app.js"]
