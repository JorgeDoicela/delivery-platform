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
readonly COMPOSE_FILE="${PROJECT_ROOT}/docker-compose.yml"
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

# Si la infraestructura base no está activa, forzar despliegue completo 'all'
if ! docker ps --format '{{.Names}}' | grep -q "^delivery-postgres$"; then
  log "La infraestructura base no está corriendo activamente. Forzando despliegue completo 'all' para asegurar inicialización."
  TARGET="all"
fi

log "Iniciando despliegue de produccion. Objetivo: ${TARGET}"

cd "$PROJECT_ROOT"

CURRENT_COMMIT="$(git rev-parse HEAD 2>/dev/null || echo 'unknown')"
log "Commit a desplegar: ${CURRENT_COMMIT}"

# Registrar commit previo si existe
if [ -f "$LAST_COMMIT_FILE" ]; then
  cp "$LAST_COMMIT_FILE" "$PREVIOUS_COMMIT_FILE"
fi

# 3. Snapshot de imágenes previas para rollback rápido (solo si el contenedor está saludable)
log "Respaldando tags de imagenes actuales a :previous para rollback rapido..."
for svc in backend frontend nginx; do
  container_name="delivery-${svc}"
  health_state="$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container_name" 2>/dev/null || echo 'none')"
  if [ "$health_state" != "healthy" ] && [ "$health_state" != "running" ]; then
    log "Aviso: ${container_name} en estado '${health_state}'. Se preserva :previous existente sin sobrescribir."
    continue
  fi

  img="$(docker compose -f "$COMPOSE_FILE" images -q "$svc" 2>/dev/null || true)"
  if [ -n "$img" ]; then
    tag_name="$(docker inspect --format='{{index .RepoTags 0}}' "$img" 2>/dev/null || true)"
    if [ -n "$tag_name" ] && [ "$tag_name" != "<none>:<none>" ]; then
      base="${tag_name%%:*}"
      docker tag "$tag_name" "${base}:previous" 2>/dev/null || true
    fi
  fi
done

# 4. Descarga inmutable y despliegue según el target
case "$TARGET" in
  backend)
    log "Descargando imagen actualizada del servicio BACKEND..."
    if ! docker compose -f "$COMPOSE_FILE" pull backend; then
      log "Aviso: No se pudo descargar la imagen remota. Compilando localmente..."
      docker compose -f "$COMPOSE_FILE" build backend
    fi
    docker compose -f "$COMPOSE_FILE" up -d --no-deps backend
    SERVICES_TO_CHECK=("delivery-backend")
    ;;
  frontend)
    log "Descargando imagen actualizada del servicio FRONTEND..."
    if ! docker compose -f "$COMPOSE_FILE" pull frontend; then
      log "Aviso: No se pudo descargar la imagen remota. Compilando localmente..."
      docker compose -f "$COMPOSE_FILE" build frontend
    fi
    docker compose -f "$COMPOSE_FILE" up -d --no-deps frontend
    SERVICES_TO_CHECK=("delivery-frontend")
    ;;
  all|infra)
    log "Descargando imagenes actualizadas del stack completo..."
    if ! docker compose -f "$COMPOSE_FILE" pull; then
      log "Aviso: No se pudieron descargar imagenes remotas. Compilando localmente..."
      docker compose -f "$COMPOSE_FILE" build
    fi
    docker compose -f "$COMPOSE_FILE" up -d --remove-orphans
    SERVICES_TO_CHECK=("delivery-postgres" "delivery-redis" "delivery-backend" "delivery-frontend" "delivery-nginx")
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
    log "Diagnostico de inspeccion de ${service_container}:"
    docker inspect --format='{{json .State.Health}}' "$service_container" 2>/dev/null || true
    log "Ultimos logs de ${service_container}:"
    docker logs --tail 50 "$service_container" 2>/dev/null || true
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

# Limpieza preventiva de imagenes intermedias huerfanas (ahorro de disco en servidor)
log "Limpiando capas de imagenes obsoletas huerfanas..."
docker image prune -f >/dev/null 2>&1 || true

log "Despliegue completado con exito. Todos los servicios estan saludables."
log "Commit registrado como exitoso: ${CURRENT_COMMIT}"
exit 0
