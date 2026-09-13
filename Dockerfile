# ==========================================
# Stage 1: Build React Frontend
# ==========================================
FROM node:24-alpine AS client-builder
WORKDIR /app

# Copy root workspace and client definitions
COPY package*.json ./
COPY tsconfig.base.json ./
COPY client/package*.json ./client/
COPY shared/ ./shared/

RUN npm ci --workspace=client

COPY client/ ./client/
RUN npm run build --workspace=client

# ==========================================
# Stage 2: Build Node.js Backend
# ==========================================
FROM node:24-alpine AS server-builder
WORKDIR /app

COPY package*.json ./
COPY tsconfig.base.json ./
COPY server/package*.json ./server/
COPY shared/ ./shared/

RUN npm ci --workspace=server

COPY server/ ./server/
RUN npm run build --workspace=server

# ==========================================
# Stage 3: Production Runtime
# ==========================================
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000
ENV DATABASE_PATH=/app/data/pulseops.db

# Install curl for container health checks
RUN apk add --no-cache curl

# Copy root manifests and production dependencies
COPY package*.json ./
COPY server/package*.json ./server/
COPY shared/ ./shared/

RUN npm ci --workspace=server --omit=dev

# Copy compiled backend
COPY --from=server-builder /app/server/dist ./server/dist

# Copy compiled frontend assets; the server serves these directly (see
# server/src/app.ts) so one container runs both the API and the dashboard
COPY --from=client-builder /app/client/dist ./client/dist

# Create persistent data directory with non-root ownership
RUN mkdir -p /app/data && chown -R node:node /app

USER node

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:4000/api/health || exit 1

CMD ["node", "server/dist/server/src/index.js"]
