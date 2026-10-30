# ─── Stage 1: Build ─────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS builder
WORKDIR /app

# Build tools needed for native addons (e.g. better-sqlite3)
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

# Install dependencies first (layer-cached unless package.json changes)
COPY package*.json ./

# Limpa cache antes de instalar para evitar EINTEGRITY
RUN npm cache clean --force && npm ci --no-audit --no-fund

# RUN npm ci

# Copy source and build
COPY . .

ARG NUXT_PUBLIC_SITE_URL=http://localhost:3000
ENV NUXT_PUBLIC_SITE_URL=${NUXT_PUBLIC_SITE_URL}

RUN npm run build

# ─── Stage 2: Run ────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

# PostgreSQL client tools for database backup via /api/updates/backup
RUN apt-get update \
  && apt-get install -y --no-install-recommends postgresql-client \
  && rm -rf /var/lib/apt/lists/*

RUN addgroup --system matrix && adduser --system --ingroup matrix --no-create-home matrix

# .output is fully self-contained (server, public assets)
COPY --chown=matrix:matrix --from=builder /app/.output ./.output

# Drizzle migrations are loaded at runtime via a relative path ("./server/database/migrations")
# They must live alongside .output so the path resolves correctly inside the container
COPY --chown=matrix:matrix --from=builder /app/server/database/migrations ./server/database/migrations

# CHANGELOG.md is read at runtime by /api/updates/changelog
# COPY --chown=matrix:matrix --from=builder /app/CHANGELOG.md ./CHANGELOG.md

# Seed script support — copies node_modules, package.json, and server source
# so `docker compose exec app npm run db:seed` works inside the container
COPY --chown=matrix:matrix --from=builder /app/package.json ./package.json
COPY --chown=matrix:matrix --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --chown=matrix:matrix --from=builder /app/node_modules ./node_modules
COPY --chown=matrix:matrix --from=builder /app/server ./server

USER matrix

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
