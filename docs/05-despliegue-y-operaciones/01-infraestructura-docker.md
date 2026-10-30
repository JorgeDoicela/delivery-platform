# 01. Infraestructura Local con Docker Compose

## 1. Descripcion General
La persistencia y el motor de cache local estan orquestados mediante Docker Compose en el archivo `docker-compose.yml` en la raiz del repositorio.

## 2. Definicion de Servicios

### 2.1. Base de Datos Principal: `delivery-postgres`
* **Imagen:** `postgis/postgis:16-3.4`
* **Puerto Expuesto:** `5432:5432`
* **Variables de Entorno:**
  - `POSTGRES_DB=delivery`
  - `POSTGRES_USER=postgres`
  - `POSTGRES_PASSWORD=postgres_dev_password`
* **Volumen Persistente:** `postgres_data:/var/lib/postgresql/data`
* **Script de Inicializacion:** `scripts/db/init-postgis.sql` montado en `/docker-entrypoint-initdb.d/01-init-postgis.sql:ro` (extensiones PostGIS y uuid-ossp).
* **Mecanismo de Healthcheck:**
  ```yaml
  test: ["CMD-SHELL", "pg_isready -U postgres -d delivery"]
  interval: 5s
  timeout: 5s
  retries: 5
  ```

### 2.2. Motor de Cache y GEO: `delivery-redis`
* **Imagen:** `redis:7-alpine`
* **Puerto Expuesto:** `6379:6379`
* **Comando de Arranque:** `redis-server --requirepass redis_dev_password`
* **Volumen Persistente:** `redis_data:/data`
* **Mecanismo de Healthcheck:**
  ```yaml
  test: ["CMD", "redis-cli", "-a", "redis_dev_password", "ping"]
  interval: 5s
  timeout: 5s
  retries: 5
  ```

### 2.3. Backend API .NET 8: `delivery-backend`
* **Imagen:** `delivery-backend:latest` (construida desde `backend/Dockerfile`)
* **Puerto Expuesto:** `5005:5005`
* **Variables de Entorno:**
  - `ASPNETCORE_ENVIRONMENT=Development`
  - `ASPNETCORE_URLS=http://+:5005`
  - `ConnectionStrings__DefaultConnection=Host=postgres;Port=5432;Database=delivery;Username=postgres;Password=postgres_dev_password`
  - `ConnectionStrings__Redis=redis:6379,password=redis_dev_password`
* **Dependencias:** `postgres` y `redis` en estado saludable (`service_healthy`).
* **Mecanismo de Healthcheck:**
  ```yaml
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://127.0.0.1:5005/health"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 20s
  ```

### 2.4. Frontend Web Next.js 16: `delivery-frontend`
* **Imagen:** `delivery-frontend:latest` (construida desde `frontend/Dockerfile`)
* **Puerto Expuesto:** `3005:3005`
* **Variables de Entorno:**
  - `NODE_ENV=production`
  - `PORT=3005`
  - `HOSTNAME=0.0.0.0`
  - `NEXT_PUBLIC_API_URL=http://localhost:5005`
  - `NEXT_PUBLIC_WS_URL=http://localhost:5005/hubs`
* **Dependencias:** `backend` en estado saludable (`service_healthy`).
* **Mecanismo de Healthcheck:**
  ```yaml
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://127.0.0.1:3005/api/health"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 15s
  ```

---

## 3. Comandos de Gestion de Infraestructura

### Iniciar Servicios en Segundo Plano
```powershell
docker compose up -d
```

### Verificar Estado y Salud de Contenedores
```powershell
docker compose ps
```

### Reiniciar o Detener Servicios
```powershell
docker compose down
```

---

## 4. Scripts de Operacion y Despliegue en Produccion
Para la gestion del ciclo de vida en servidores remotos y contingencias de produccion, los scripts operativos residen en `scripts/deploy/`:
* `scripts/deploy/deploy.sh`: Automatizacion de despliegue con verificacion activa de health checks y fallback.
* `scripts/deploy/rollback.sh`: Reversion inmediata a imagenes Docker con etiqueta `:previous`.

Consulte la guia detallada de CI/CD y despliegue continuo en [03-guia-despliegue-devops.md](./03-guia-despliegue-devops.md).

---

## Navegacion de Documentacion
* **Anterior:** [03. Herramienta Movil del Repartidor y Telemetria GPS](../04-frontend-web/03-pantalla-repartidor-gps.md)
* **Siguiente:** [02. Empaquetado Movil con Capacitor](./02-empaquetado-capacitor.md)
* **Indice General:** [README Principal](../../README.md)
