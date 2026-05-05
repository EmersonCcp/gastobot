# --- Stage 1: Build Client ---
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# --- Stage 2: Build Server ---
FROM node:20-alpine AS server-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/ ./
RUN npm run build

# --- Stage 3: Runtime ---
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Copiar el package.json de la raíz (Para que Railway encuentre los scripts)
COPY package*.json ./

# Copiar archivos compilados y dependencias del servidor
COPY --from=server-builder /app/server/dist ./server/dist
COPY --from=server-builder /app/server/package*.json ./server/
COPY --from=server-builder /app/server/node_modules ./server/node_modules

# Copiar archivos compilados del cliente
COPY --from=client-builder /app/client/dist ./client/dist

EXPOSE 3001
# Ejecutamos usando el script de la raíz
CMD ["npm", "start"]
