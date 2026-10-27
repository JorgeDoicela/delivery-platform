#!/usr/bin/env bash
# ==============================================================================
# Script de Despliegue Automatizado con Healthcheck Activo y Rollback Automático
# Repositorio: Delivery Platform
# Estándar: SysAdmin Senior (Cero Parches, Idempotencia y Manejo Defensivo)
# ==============================================================================

set -euo pipefail
IFS=$'\n\t'

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
readonly COMPOSE_FILE="${PROJECT_ROOT}/docker-compose.prod.yml"
readonly ENV_FILE="${PROJECT_ROOT}/.env"
readonly ROLLBACK_SCRIPT="${SCRIPT_DIR}/rollback.sh"
readonly LAST_COMMIT_FILE="${PROJECT_ROOT}/.last_successful_commit"
readonly PREVIOUS_COMMIT_FILE="${PROJECT_ROOT}/.previous_commit"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

die() {
  log "ERROR: $*" >&2
  exit 1
}

# 1. Verificación de prerrequisitos de infraestructura
command -v docker >/dev/null 2>&1 || die "Docker no esta instalado en el sistema."
docker compose version >/dev/null 2>&1 || die "Docker Compose v2 no esta disponible."

if [ ! -f "$COMPOSE_FILE" ]; then
  die "Archivo de orquestacion no encontrado: $COMPOSE_FILE"
fi

if [ ! -f "$ENV_FILE" ]; then
  die "Archivo de variables de entorno .env no encontrado en: $ENV_FILE"
fi

# 2. Análisis del objetivo de despliegue (selective deployment)
TARGET="${1:-all}"
log "Iniciando despliegue de produccion. Objetivo: ${TARGET}"

cd "$PROJECT_ROOT"

CURRENT_COMMIT="$(git rev-parse HEAD 2>/dev/null || echo 'unknown')"
log "Commit a desplegar: ${CURRENT_COMMIT}"

# Registrar commit previo si existe
if [ -f "$LAST_COMMIT_FILE" ]; then
  cp "$LAST_COMMIT_FILE" "$PREVIOUS_COMMIT_FILE"
fi

# 3. Snapshot de imágenes previas para rollback rápido
log "Respaldando tags de imagenes actuales a :previous para rollback rapido..."
if docker image inspect delivery-backend:latest >/dev/null 2>&1; then
  docker tag delivery-backend:latest delivery-backend:previous || true
fi
if docker image inspect delivery-frontend:latest >/dev/null 2>&1; then
  docker tag delivery-frontend:latest delivery-frontend:previous || true
fi

# 4. Construcción y despliegue según el target
case "$TARGET" in
  backend)
    log "Reconstruyendo y desplegando unicamente el servicio BACKEND..."
    docker compose -f "$COMPOSE_FILE" build backend
    docker compose -f "$COMPOSE_FILE" up -d --no-deps backend
    SERVICES_TO_CHECK=("delivery-backend-prod")
    ;;
  frontend)
    log "Reconstruyendo y desplegando unicamente el servicio FRONTEND..."
    docker compose -f "$COMPOSE_FILE" build frontend
    docker compose -f "$COMPOSE_FILE" up -d --no-deps frontend
    SERVICES_TO_CHECK=("delivery-frontend-prod")
    ;;
  all|infra)
    log "Reconstruyendo y desplegando el stack completo..."
    docker compose -f "$COMPOSE_FILE" up -d --build --remove-orphans
    SERVICES_TO_CHECK=("delivery-postgres-prod" "delivery-redis-prod" "delivery-backend-prod" "delivery-frontend-prod")
    ;;
  *)
    die "Target desconocido: ${TARGET}. Opciones validas: all, backend, frontend, infra"
    ;;
esac

# 5. Sondeo activo de salud (Healthcheck Activo)
wait_for_health() {
  local container="$1"
  local max_attempts=18
  local attempt=1
  local wait_seconds=5

  log "Verificando salud del contenedor: ${container}..."

  while [ "$attempt" -le "$max_attempts" ]; do
    local status
    status="$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container" 2>/dev/null || echo 'not_found')"

    if [ "$status" = "healthy" ] || [ "$status" = "running" ]; then
      log "Contenedor ${container} verificado correctamente con estado: ${status}."
      return 0
    fi

    log "Intento ${attempt}/${max_attempts} - Estado actual de ${container}: ${status}. Esperando ${wait_seconds}s..."
    sleep "$wait_seconds"
    attempt=$((attempt + 1))
  done

  return 1
}

log "Iniciando verificacion de salud activa de los contenedores desplegados..."
DEPLOYMENT_FAILED=0

for service_container in "${SERVICES_TO_CHECK[@]}"; do
  if ! wait_for_health "$service_container"; then
    log "FALLO CRITICO: El servicio ${service_container} no supero el healthcheck a tiempo."
    DEPLOYMENT_FAILED=1
    break
  fi
done

# 6. Ejecución de Rollback automático en caso de fallo
if [ "$DEPLOYMENT_FAILED" -eq 1 ]; then
  log "ALERTA: Se detecto un fallo en la verificacion de salud. Ejecutando rollback automatico..."
  if [ -x "$ROLLBACK_SCRIPT" ]; then
    "$ROLLBACK_SCRIPT" "$TARGET"
  else
    bash "$ROLLBACK_SCRIPT" "$TARGET"
  fi
  die "El despliegue fallo y se ejecuto el rollback automatico con exito a la version anterior."
fi

# 7. Despliegue confirmado y exitoso
echo "$CURRENT_COMMIT" > "$LAST_COMMIT_FILE"
log "Despliegue completado con exito. Todos los servicios estan saludables."
log "Commit registrado como exitoso: ${CURRENT_COMMIT}"
exit 0
