# ==========================================
# Multi-stage Dockerfile para Next.js (Frontend Monorepo)
# ==========================================

# 1. Base con Node y Corepack (pnpm)
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@11.24.0 --activate

# 2. Instalación de dependencias del workspace
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY frontend/package.json ./frontend/
RUN pnpm --filter frontend install --frozen-lockfile

# 3. Compilación de producción
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules
COPY pnpm-workspace.yaml package.json ./
COPY frontend/ ./frontend/

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Argumentos de compilación para variables públicas en el bundle cliente
ARG NEXT_PUBLIC_API_URL=http://localhost:5005
ARG NEXT_PUBLIC_WS_URL=http://localhost:5005/hubs
ARG NEXT_PUBLIC_MAP_STYLE_URL=https://demotiles.maplibre.org/style.json
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_MAP_STYLE_URL=$NEXT_PUBLIC_MAP_STYLE_URL

WORKDIR /app/frontend
RUN pnpm build

# 4. Runtime ligero de producción
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3005
ENV HOSTNAME="0.0.0.0"

# Crear usuario de sistema sin privilegios de root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar archivos públicos y el build standalone generado por el monorepo
COPY --from=builder /app/frontend/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/standalone/frontend ./
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/standalone/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/static ./.next/static

USER nextjs

EXPOSE 3005

HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3005/api/health || exit 1

CMD ["node", "server.js"]
