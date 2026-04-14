FROM node:20-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
RUN npm install

# Copiar el resto del código
COPY . .

# Exponer el puerto del Gateway
EXPOSE 3000

# Por defecto levantamos la API
CMD ["npm", "run", "start:api"]