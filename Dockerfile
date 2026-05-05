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

# Copy server built files and dependencies
COPY --from=server-builder /app/server/dist ./server/dist
COPY --from=server-builder /app/server/package*.json ./server/
COPY --from=server-builder /app/server/node_modules ./server/node_modules

# Copy client built files
COPY --from=client-builder /app/client/dist ./client/dist

EXPOSE 3001
CMD ["node", "server/dist/index.js"]
