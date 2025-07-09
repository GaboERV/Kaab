FROM node:20

# Establece el directorio de trabajo
WORKDIR /home/app

# Copia solo los archivos necesarios para instalar dependencias
COPY package*.json ./

# Instala dependencias sin devDependencies (ideal para producción)
RUN npm ci


# Copia el resto del código
COPY . .

# Compila tu app si usas TypeScript/NestJS
RUN npm run build

# Expone el puerto donde corre la app
EXPOSE 3000

# Comando para producción
CMD ["npm", "run", "start:prod"]