#!/usr/bin/env bash
# ==============================================================================
# Script de Rollback Inmediato y Recuperación de Stack
# Repositorio: Delivery Platform
# Estándar: SysAdmin Senior (Cero Parches, Idempotencia y Resiliencia)
# ==============================================================================

set -euo pipefail
IFS=$'\n\t'

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
readonly COMPOSE_FILE="${PROJECT_ROOT}/docker-compose.prod.yml"
readonly LAST_COMMIT_FILE="${PROJECT_ROOT}/.last_successful_commit"
readonly PREVIOUS_COMMIT_FILE="${PROJECT_ROOT}/.previous_commit"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ROLLBACK] $*"
}

die() {
  log "ERROR CRITICO EN ROLLBACK: $*" >&2
  exit 1
}

TARGET="${1:-all}"
log "Iniciando procedimiento de ROLLBACK para objetivo: ${TARGET}"

cd "$PROJECT_ROOT"

# 1. Revertir imágenes docker taggeadas a :previous
rollback_image() {
  local service_name="$1"
  local image_name="$2"

  if docker image inspect "${image_name}:previous" >/dev/null 2>&1; then
    log "Restaurando imagen ${image_name}:previous a ${image_name}:latest..."
    docker tag "${image_name}:previous" "${image_name}:latest"
    docker compose -f "$COMPOSE_FILE" up -d --no-deps "$service_name"
  else
    log "AVISO: No se encontro tag ${image_name}:previous en el cache local."
  fi
}

case "$TARGET" in
  backend)
    rollback_image "backend" "delivery-backend"
    ;;
  frontend)
    rollback_image "frontend" "delivery-frontend"
    ;;
  all|infra)
    rollback_image "backend" "delivery-backend"
    rollback_image "frontend" "delivery-frontend"
    ;;
esac

# 2. Revertir código en Git si existe registro del último commit exitoso
if [ -f "$PREVIOUS_COMMIT_FILE" ]; then
  PREV_COMMIT="$(cat "$PREVIOUS_COMMIT_FILE")"
  if [ -n "$PREV_COMMIT" ] && [ "$PREV_COMMIT" != "unknown" ]; then
    log "Revertiendo arbol de trabajo Git al ultimo commit estable: ${PREV_COMMIT}..."
    git checkout -f "$PREV_COMMIT" || log "Aviso: No se pudo hacer checkout del commit anterior."
    cp "$PREVIOUS_COMMIT_FILE" "$LAST_COMMIT_FILE"
  fi
elif [ -f "$LAST_COMMIT_FILE" ]; then
  LAST_COMMIT="$(cat "$LAST_COMMIT_FILE")"
  log "Verificando consistencia con ultimo commit exitoso: ${LAST_COMMIT}"
fi

# 3. Levantar contenedores asegurando estado operacional
log "Asegurando ejecucion de contenedores estables..."
docker compose -f "$COMPOSE_FILE" up -d

# 4. Verificación de salud posterior al rollback
log "Comprobando salud del backend tras el rollback..."
sleep 5

if docker inspect --format='{{.State.Status}}' delivery-backend-prod 2>/dev/null | grep -q "running"; then
  log "Backend recuperado exitosamente."
else
  die "El backend no pudo recuperarse tras el rollback."
fi

if docker inspect --format='{{.State.Status}}' delivery-frontend-prod 2>/dev/null | grep -q "running"; then
  log "Frontend recuperado exitosamente."
else
  die "El frontend no pudo recuperarse tras el rollback."
fi

log "Procedimiento de ROLLBACK finalizado con exito. El sistema se encuentra en su version estable previa."
exit 0
