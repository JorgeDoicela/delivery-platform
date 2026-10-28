# 03. Guia Tecnica de CI/CD, Despliegue Automatizado y Rollback

Este documento define la arquitectura de automatizacion de despliegue, la configuracion de secretos en GitHub Actions y las operaciones de mantenimiento para el servidor de produccion de **Delivery Platform**.

---

## Modulos Relacionados en Operaciones
* [01. Infraestructura Local con Docker Compose](./01-infraestructura-docker.md)
* [02. Empaquetado Movil con Capacitor](./02-empaquetado-capacitor.md)

---

## 1. Arquitectura de Despliegue y Flujo Operativo

El sistema opera bajo un pipeline continuo y desacoplado mediante GitHub Actions y Docker Compose:

```
[ Desarrollador ]
       │  git push main
       ▼
[ GitHub Actions: CI ] ────► ESLint + Vitest (Frontend)
       │                      Dotnet Build + xUnit (Backend)
       │                      Hadolint (Dockerfiles)
       ▼
[ Reconocimiento de Cambios ]
  ├─ Cambios en frontend/**        ──► Target: frontend
  ├─ Cambios en backend/**         ──► Target: backend
  └─ Cambios en ambos o infra/**   ──► Target: all
       │
       ▼ (Conexión segura SSH con clave ed25519)
[ Servidor de Producción ]
       │  git fetch & reset hard origin/main
       │  Taggeo de imágenes actuales como :previous
       │  docker compose -f docker-compose.prod.yml build & up -d
       │  Sondeo activo de healthchecks (18 intentos x 5s)
       │
       ├─► [Exitoso] ──► Registra commit en .last_successful_commit
       │
       └─► [Fallo]   ──► Dispara automáticamente ./scripts/deploy/rollback.sh
                         Restaura imágenes :previous y notifica fallo en CI/CD.
```

---

## 2. Matriz de Secretos en GitHub Actions

Para habilitar el despliegue automático, configure los siguientes secretos en el repositorio de GitHub:  
**Ruta:** `Configuración del Repositorio` ➔ `Secrets and variables` ➔ `Actions` ➔ `New repository secret`

| Nombre del Secreto | Descripción | Ejemplo / Formato |
| :--- | :--- | :--- |
| `SSH_HOST` | Dirección IP pública o nombre de dominio del servidor de producción. | `198.51.100.24` o `servidor.delivery.com` |
| `SSH_USER` | Usuario del servidor con permisos de ejecución en Docker y Git. | `deploy` o `ubuntu` |
| `SSH_KEY` | Clave privada SSH sin frase de paso (formato OpenSSH). | Contenido completo de `~/.ssh/id_ed25519` |
| `SSH_PORT` | Puerto de escucha del servicio SSH en el servidor remoto. | `22` (o puerto personalizado) |
| `DEPLOY_PATH` | Ruta absoluta donde se encuentra clonado el proyecto en el servidor. | `/opt/delivery-platform` |

---

## 3. Preparación Inicial del Servidor de Producción

Ejecute los siguientes pasos una única vez en el servidor destino:

### 3.1. Requisitos de Software
Asegúrese de contar con Docker Engine v24+, Docker Compose v2 y Git instalados:
```bash
docker --version
docker compose version
git --version
```

### 3.2. Usuario de Despliegue y Permisos de Docker
Evite desplegar directamente como `root`. Cree un usuario dedicado con pertenencia al grupo `docker`:
```bash
sudo usermod -aG docker deploy
```

### 3.3. Clonado Inicial del Repositorio
```bash
sudo mkdir -p /opt/delivery-platform
sudo chown -R deploy:deploy /opt/delivery-platform
cd /opt/delivery-platform
git clone https://github.com/JorgeDoicela/delivery-platform.git .
```

### 3.4. Archivo de Variables de Entorno (`.env`)
Cree el archivo `/opt/delivery-platform/.env` con permisos restringidos (`chmod 600 .env`):
```ini
# Configuración de Base de Datos PostgreSQL + PostGIS
POSTGRES_DB=delivery
POSTGRES_USER=postgres
POSTGRES_PASSWORD=Definir_Password_Seguro_Postgres_Prod
POSTGRES_PORT=5432

# Configuración de Redis
REDIS_PASSWORD=Definir_Password_Seguro_Redis_Prod
REDIS_PORT=6379

# Puertos de Servicios Web
API_PORT=5005
PORT=3005

# URLs Públicas para el Frontend
NEXT_PUBLIC_API_URL=https://api.tudominio.com
NEXT_PUBLIC_WS_URL=https://api.tudominio.com
```

---

## 4. Endpoints de Comprobación de Salud (Healthchecks)

Cada servicio en producción dispone de un endpoint HTTP dedicado para monitoreo de contenedores, balanceadores y scripts de despliegue:

* **Backend (.NET 8):** `GET http://127.0.0.1:5005/health`  
  Retorna código HTTP `200 OK` con payload JSON:
  ```json
  {
    "status": "Healthy",
    "service": "Delivery.Api",
    "timestamp": "2026-10-27T22:20:00Z"
  }
  ```

* **Frontend (Next.js 16):** `GET http://127.0.0.1:3005/api/health`  
  Retorna código HTTP `200 OK` con payload JSON:
  ```json
  {
    "status": "healthy",
    "service": "delivery-frontend",
    "timestamp": "2026-10-27T22:20:00Z"
  }
  ```

---

## 5. Procedimientos de Rollback

### 5.1. Rollback Automático (Ante Fallo de Healthcheck)
Si un nuevo despliegue no supera las comprobaciones de salud en 90 segundos (18 intentos de 5s), el script `scripts/deploy/deploy.sh` invoca inmediatamente `scripts/deploy/rollback.sh`:
1. Re-etiqueta las imágenes de respaldo `delivery-backend:previous` y `delivery-frontend:previous` a `:latest`.
2. Recrea los contenedores con la versión anterior estable.
3. El pipeline de GitHub Actions se marca como fallido para auditoría técnica.

### 5.2. Rollback Manual (Desde Interfaz de GitHub)
En caso de detectar un comportamiento no deseado en producción posterior al despliegue:
1. Acceda a la pestaña **Actions** en GitHub.
2. Seleccione el workflow **Manual Rollback Pipeline**.
3. Haga clic en **Run workflow**, seleccione el target (`all`, `backend` o `frontend`) e ingrese el motivo del rollback.
4. El script se conectará por SSH y restaurará la versión estable previa en menos de 30 segundos.

---

## 6. Estructura de Scripts Operativos (`scripts/`)

El repositorio centraliza sus herramientas de línea de comandos en la carpeta raíz `scripts/` estructurada por ámbito de responsabilidad:

* `scripts/deploy/deploy.sh`: Ejecución de despliegue local o remoto con comprobación activa de health checks y preservación de snapshots.
  - Sintaxis: `./scripts/deploy/deploy.sh [all|backend|frontend]`
* `scripts/deploy/rollback.sh`: Reversión de emergencia a los estados etiquetados como `:previous`.
  - Sintaxis: `./scripts/deploy/rollback.sh [all|backend|frontend]`
* `scripts/db/init-postgis.sql`: Inicialización automática de PostgreSQL con extensiones `postgis` y `uuid-ossp` montada en `/docker-entrypoint-initdb.d/`.

---

## Navegacion de Documentacion
* **Anterior:** [02. Empaquetado Movil con Capacitor](./02-empaquetado-capacitor.md)
* **Siguiente:** [01. Especificacion Funcional y Roadmap de Implementacion](../06-roadmap-y-especificacion/01-especificacion-funcional-y-roadmap.md)
* **Indice General:** [README Principal](../../README.md)
