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

Consulte la guia detallada en [DEVOPS_DEPLOY_GUIDE.md](../DEVOPS_DEPLOY_GUIDE.md).
