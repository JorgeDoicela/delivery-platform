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
readonly COMPOSE_FILE="${PROJECT_ROOT}/docker-compose.yml"
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
  local base_name="$2"

  # 1. Buscar en el cache de Docker si existe cualquier imagen terminada en ${base_name}:previous
  local target_image
  target_image="$(docker images --format '{{.Repository}}:{{.Tag}}' 2>/dev/null | grep -E "(/|^)${base_name}:previous$" | head -n 1 || true)"

  if [ -n "$target_image" ]; then
    local repo_base="${target_image%:previous}"
    log "Restaurando snapshot ${target_image} -> ${repo_base}:latest..."
    docker tag "${target_image}" "${repo_base}:latest"
    docker compose -f "$COMPOSE_FILE" up -d --no-deps "$service_name"
    return 0
  fi

  # 2. Fallback a resolver la imagen configurada en Compose
  local configured_image
  configured_image="$(docker compose -f "$COMPOSE_FILE" config --images 2>/dev/null | grep -E "${base_name}(:|$)" | head -n 1 || true)"
  if [ -n "$configured_image" ]; then
    local conf_base="${configured_image%%:*}"
    if docker image inspect "${conf_base}:previous" >/dev/null 2>&1; then
      log "Restaurando ${conf_base}:previous -> ${conf_base}:latest..."
      docker tag "${conf_base}:previous" "${conf_base}:latest"
      docker compose -f "$COMPOSE_FILE" up -d --no-deps "$service_name"
      return 0
    fi
  fi

  log "AVISO: No se encontro tag ${base_name}:previous en el cache local de Docker."
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
    rollback_image "nginx" "delivery-nginx"
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
check_container_health() {
  local container="$1"
  local max_attempts=8
  local attempt=1
  local wait_seconds=3

  while [ "$attempt" -le "$max_attempts" ]; do
    local status
    status="$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container" 2>/dev/null || echo 'not_found')"
    if [ "$status" = "healthy" ] || [ "$status" = "running" ]; then
      return 0
    fi
    sleep "$wait_seconds"
    attempt=$((attempt + 1))
  done
  return 1
}

log "Comprobando salud de los servicios tras el rollback..."

if check_container_health "delivery-backend"; then
  log "Backend operativo tras rollback."
else
  die "El backend no pudo recuperarse tras el rollback."
fi

if check_container_health "delivery-frontend"; then
  log "Frontend operativo tras rollback."
else
  die "El frontend no pudo recuperarse tras el rollback."
fi

log "Procedimiento de ROLLBACK finalizado con exito. El sistema se encuentra en su version estable previa."
exit 0
