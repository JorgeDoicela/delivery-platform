# ==========================================
# Multi-stage Dockerfile para Next.js (Frontend)
# ==========================================

# 1. Base con Node y Corepack (pnpm)
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@11.24.0 --activate

# 2. Instalación de dependencias
FROM base AS deps
WORKDIR /app
COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 3. Compilación de producción
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY frontend/ .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Argumentos de compilación para variables públicas en el bundle cliente
ARG NEXT_PUBLIC_API_URL=http://localhost:5005
ARG NEXT_PUBLIC_WS_URL=http://localhost:5005
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL

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

# Copiar archivos públicos y el build standalone generado
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3005

HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3005/api/health || exit 1

CMD ["node", "server.js"]
