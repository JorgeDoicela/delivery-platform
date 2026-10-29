# Plataforma de Delivery Directo y Multi-Sucursal

Plataforma integral multitenant de venta directa, gestion de cocina (KDS), despacho logistico, telemetria satelital de repartidores, inventario por recetas y facturacion electronica SRI para asaderos de pollos y carnes a la brasa en Quito, Ecuador.

---

## 1. Indice Maestro de Documentacion Tecnica (Docs-as-Code)

La documentacion tecnica detallada del sistema se encuentra organizada bajo taxonomia jerarquica numerica dentro del directorio [`docs/`](docs/):

* **01. Arquitectura y Diseno:**
  - [`01-vision-general.md`](docs/01-arquitectura/01-vision-general.md): Topologia de red, multitenancy seguro con filtros globales, Vertical Slices en backend, Feature-Driven en frontend e inventario automatizado por recetas.
  - [`02-maquina-estados.md`](docs/01-arquitectura/02-maquina-estados.md): Diagrama formal de estados, transiciones validas, disparadores y efectos colaterales.
* **02. Backend y Servicios:**
  - [`01-vertical-slices-api.md`](docs/02-backend-servicios/01-vertical-slices-api.md): Catalogo de endpoints REST, DTOs de entrada y salida, codigos de error y validaciones.
  - [`02-signalr-hubs.md`](docs/02-backend-servicios/02-signalr-hubs.md): Especificacion de WebSocket Hubs (`KitchenHub` y `TrackingHub`) para cocina y seguimiento.
  - [`03-autenticacion-y-seguridad-rbac.md`](docs/02-backend-servicios/03-autenticacion-y-seguridad-rbac.md): Arquitectura de autenticacion JWT, rotacion criptografica de refresh tokens en cookies HttpOnly y politicas RBAC.
* **03. Base de Datos y Persistencia:**
  - [`01-modelo-datos-postgis.md`](docs/03-base-de-datos/01-modelo-datos-postgis.md): Diagrama ERD completo (24 tablas), modelo espacial PostGIS SRID 4326, kardex inmutable, facturacion SRI Ecuador, filtros multitenant e indices de alta frecuencia.
  - [`02-redis-geo-cache.md`](docs/03-base-de-datos/02-redis-geo-cache.md): Telemetria de conductores con Redis GEO, llaves con TTL y cache de idempotencia.
* **04. Frontend y Experiencia de Usuario:**
  - [`01-estructura-route-groups.md`](docs/04-frontend-web/01-estructura-route-groups.md): App Router en Next.js 16, Route Groups `(storefront)`, `(dashboard)`, `(driver)`, accesos directos operacionales y estado global Zustand.
  - [`02-pantalla-cocina-kds.md`](docs/04-frontend-web/02-pantalla-cocina-kds.md): Tablero Kanban FIFO, semaforo de tiempos y sintetizador nativo Web Audio API.
  - [`03-pantalla-repartidor-gps.md`](docs/04-frontend-web/03-pantalla-repartidor-gps.md): Transmision satelital continua, modo de simulacion para desarrollo y deep links a Waze / Google Maps.
* **05. Despliegue y Operaciones:**
  - [`01-infraestructura-docker.md`](docs/05-despliegue-y-operaciones/01-infraestructura-docker.md): Especificacion de contenedores PostgreSQL + PostGIS y Redis 7 con healthchecks.
  - [`02-empaquetado-capacitor.md`](docs/05-despliegue-y-operaciones/02-empaquetado-capacitor.md): Configuracion de Capacitor para generacion de la aplicacion movil Android / iOS.
  - [`03-guia-despliegue-devops.md`](docs/05-despliegue-y-operaciones/03-guia-despliegue-devops.md): Guia de CI/CD, secretos en GitHub Actions, despliegue continuo con Docker Compose, scripts en `scripts/deploy/` y rollback automatico.
* **06. Roadmap y Especificacion Funcional:**
  - [`01-especificacion-funcional-y-roadmap.md`](docs/06-roadmap-y-especificacion/01-especificacion-funcional-y-roadmap.md): Documento integral de requerimientos de negocio, matriz de modulos, reglas de checkout y proyeccion evolutiva.

---

## 2. Stack Tecnologico

| Capa | Tecnologia | Funcion Principal |
| :--- | :--- | :--- |
| **Backend** | .NET 8 (C# 12) | API de alto rendimiento con Vertical Slice Architecture y multitenancy nativo |
| **Persistencia Espacial** | PostgreSQL 16 + PostGIS 3.4 | Geocercas vectoriales e indices espaciales GiST (SRID 4326), esquema de 24 tablas |
| **Cache y Telemetria** | Redis 7 Alpine | Redis GEO para conductores y almacenamiento de idempotencia con TTL |
| **Comunicacion en Vivo** | ASP.NET Core SignalR | Eventos push para comanderas de cocina y seguimiento cliente |
| **Tareas en Segundo Plano** | Hangfire | Procesamiento asincrono de facturacion electronica SRI y notificaciones |
| **Frontend Web** | Next.js 16 (App Router + Turbopack) | Arquitectura unificada para Storefront, KDS de cocina y Repartidores |
| **Estado de Cliente** | Zustand + TanStack Query v5 | Persistencia en localStorage y cache de consultas de red |
| **Estilos y Componentes** | Tailwind CSS + Lucide Icons | Interfaz oscura de alto contraste, ergonomia tactil y cero emojis |
| **Empaquetado Movil** | Capacitor 8 | Exportacion a app nativa Android desde el codigo Next.js |

---

## 3. Guia de Puesta en Marcha Local

### Prerrequisitos
* Docker y Docker Compose
* .NET SDK 8.0
* Node.js 20+ y pnpm 10+

### Paso 1: Iniciar Contenedores de Base de Datos y Cache
```powershell
docker compose up -d
```
Verificar que los servicios esten saludables con `docker compose ps`.

### Paso 2: Iniciar el Backend (.NET 8)
```powershell
cd backend/src/Delivery.Api
dotnet run
```
*API disponible en:* `http://localhost:5005`  
*Swagger UI:* `http://localhost:5005/swagger`

### Paso 3: Iniciar el Frontend (Next.js 16)
```powershell
cd frontend
pnpm dev
```
*Aplicacion disponible en:* `http://localhost:3005`

---

## 4. Puntos de Entrada y Rutas Operativas de la Aplicacion Web

* **Storefront y Menu Comercial:** `http://localhost:3005/`
* **Catalogo Completo:** `http://localhost:3005/catalogo` (o `#catalogo`)
* **Sucursales y Horarios:** `http://localhost:3005/sucursales` (o `#sucursales`)
* **Checkout con Resolucion de Cobertura:** `http://localhost:3005/finalizar-pedido` (o `/checkout`)
* **Seguimiento del Pedido en Vivo:** `http://localhost:3005/rastreo` (o `/track/<order-uuid>`)
* **Pantalla de Cocina (KDS en Tiempo Real):** `http://localhost:3005/cocina` (o `/kitchen`)
* **Control de Inventario y Kardex:** `http://localhost:3005/admin/inventario`
* **Capacidad de Hornos por Slot:** `http://localhost:3005/admin/sucursales`
* **Portal del Repartidor:** `http://localhost:3005/repartidor`
* **Ruta Activa con Transmision GPS:** `http://localhost:3005/active-delivery`
