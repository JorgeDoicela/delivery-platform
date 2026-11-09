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
       │  docker compose build & up -d
       │  Sondeo activo de healthchecks (18 intentos x 5s)
       │
       ├─► [Exitoso] ──► Registra commit en .last_successful_commit
       │
       └─► [Fallo]   ──► Dispara automáticamente ./scripts/deploy/rollback.sh
                         Restaura imágenes :previous y notifica fallo en CI/CD.
```

---

## 2. Matriz de Secretos y Variables en GitHub Actions

Para habilitar el despliegue automático hacia un nuevo servidor o VPS, configure los siguientes secretos y variables en el repositorio de GitHub:  
**Ruta:** `Configuracion del Repositorio` -> `Settings` -> `Secrets and variables` -> `Actions`

### 2.1. Secretos Obligatorios (`Repository secrets`)

| Nombre del Secreto | Descripción | Ejemplo / Formato |
| :--- | :--- | :--- |
| `SSH_HOST` | Dirección IP pública o nombre de host del nuevo servidor. | `198.51.100.24` o `servidor.mesafy.dev` |
| `SSH_USER` | Usuario del servidor con permisos en Docker y Git. | `deploy` |
| `SSH_KEY` | Clave privada SSH sin contraseña (formato OpenSSH ed25519 o RSA). | Contenido completo de `~/.ssh/id_ed25519` |
| `SSH_PORT` | Puerto del demonio SSH en el servidor remoto. | `22` (o puerto personalizado) |
| `DEPLOY_PATH` | Ruta absoluta de despliegue en el sistema de archivos del servidor. | `/opt/delivery-platform` |

### 2.2. Secretos y Variables Opcionales

| Nombre | Tipo | Descripción | Valor por Defecto |
| :--- | :--- | :--- | :--- |
| `GHCR_PAT` | Secret | Token personal de GitHub (PAT) con alcance `read:packages` si el repositorio de imágenes es privado. | `${{ secrets.GITHUB_TOKEN }}` |
| `PLATFORM_DOMAIN` | Variable | Dominio canónico de la plataforma frontend. | `mesafy.doicela.dev` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Variable | Client ID de Google Identity Services para autenticación federada en frontend. | Vacío (Opcional) |

---

## 3. Preparación Inicial y Migración a un Nuevo Servidor (Checklist)

Para aprovisionar un servidor nuevo (Ubuntu 22.04 / 24.04 LTS o Debian 12) desde cero:

### 3.1. Requisitos de Software
Instale Docker Engine oficial (v24+), Docker Compose (v2+) y Git:
```bash
sudo apt update && sudo apt install -y curl git ufw
curl -fsSL https://get.docker.com | sudo sh
sudo systemctl enable --now docker
```

### 3.2. Configuración de Usuario Dedicado de Despliegue
Cree el usuario de servicio `deploy` y agréguelo al grupo `docker` para evitar operar como `root`:
```bash
sudo adduser --disabled-password --gecos "" deploy
sudo usermod -aG docker deploy

# Configurar directorio SSH para autenticacion por clave
sudo mkdir -p /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
# Agregar la clave publica autorizada (id_ed25519.pub)
echo "ssh-ed25519 AAAAC3... clave_publica_despliegue" | sudo tee /home/deploy/.ssh/authorized_keys
sudo chmod 600 /home/deploy/.ssh/authorized_keys
sudo chown -R deploy:deploy /home/deploy/.ssh
```

### 3.3. Configuración de Firewall Perimetral (UFW)
Asegure que los servicios internos (BD PostgreSQL 5432 y Redis 6379) permanezcan inaccesibles desde internet:
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP Nginx'
sudo ufw allow 443/tcp comment 'HTTPS Nginx'
sudo ufw --force enable
```

### 3.4. Preparación del Directorio de Despliegue
```bash
sudo mkdir -p /opt/delivery-platform
sudo chown -R deploy:deploy /opt/delivery-platform
```

### 3.5. Archivo de Variables de Entorno (`.env`) en el Nuevo Servidor
Cree el archivo `/opt/delivery-platform/.env` con permisos restringidos (`chmod 600 .env`):
```bash
cd /opt/delivery-platform
cp .env.example .env # o crearlo manualmente si es primera ejecucion
chmod 600 .env
```
Contenido de `/opt/delivery-platform/.env` adaptado para producción:
```ini
# Puertos y Seguridad de Red
HTTP_PORT=80
HTTPS_PORT=443
PORT=3005
API_PORT=5005
POSTGRES_PORT=5432
REDIS_PORT=6379
# Enlaces locales seguros: impide exposicion a internet de BD, Redis, Backend y Frontend
POSTGRES_BIND_IP=127.0.0.1
REDIS_BIND_IP=127.0.0.1
API_BIND_IP=127.0.0.1
FRONTEND_BIND_IP=127.0.0.1

# Registro de Contenedores
IMAGE_REGISTRY_PREFIX=ghcr.io/jorgedoicela/delivery-platform

# Base de Datos PostgreSQL 16 + PostGIS
POSTGRES_DB=delivery
POSTGRES_USER=postgres
POSTGRES_PASSWORD=GenerarPasswordAleatorioSeguro_Postgres_32Chars!

# Cache y GEO Redis 7
REDIS_PASSWORD=GenerarPasswordAleatorioSeguro_Redis_32Chars!

# Backend API (.NET 8)
ASPNETCORE_ENVIRONMENT=Production
JWT_SECRET=GenerarClaveAleatoriaCriptograficaMinimo32Caracteres!
JWT_ISSUER=DeliveryPlatform.Api
JWT_AUDIENCE=DeliveryPlatform.Clients
INITIAL_ADMIN_PASSWORD=GenerarAdminPasswordProduccion123!

# Frontend Web y Plataforma (Next.js 16)
NEXT_PUBLIC_PLATFORM_DOMAIN=mesafy.doicela.dev
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_WS_URL=
NEXT_PUBLIC_MAP_STYLE_URL=https://demotiles.maplibre.org/style.json
INTERNAL_API_URL=http://backend:5005
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
