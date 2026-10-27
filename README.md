# Plataforma de Delivery Directo para 2 Sucursales

Plataforma integral de venta directa, gestion de cocina (KDS), despacho logistico y telemetria satelital de repartidores para 2 sucursales operativas en Quito, Ecuador.

---

## 1. Indice Maestro de Documentacion Tecnica (Docs-as-Code)

La documentacion tecnica detallada del sistema se encuentra organizada bajo taxonomia jerarquica numerica dentro del directorio [`docs/`](file:///c:/Users/DESARROLLADOR/Desktop/Proyectos/delivery-platform/docs/):

* **01. Arquitectura y Diseno:**
  - [`01-vision-general.md`](file:///c:/Users/DESARROLLADOR/Desktop/Proyectos/delivery-platform/docs/01-arquitectura/01-vision-general.md): Topologia de red, patrones arquitectonicos (Vertical Slices y Feature-Driven), idempotencia y control de flujo.
  - [`02-maquina-estados.md`](file:///c:/Users/DESARROLLADOR/Desktop/Proyectos/delivery-platform/docs/01-arquitectura/02-maquina-estados.md): Diagrama formal de estados, transiciones validas, disparadores y efectos colaterales.
* **02. Backend y Servicios:**
  - [`01-vertical-slices-api.md`](file:///c:/Users/DESARROLLADOR/Desktop/Proyectos/delivery-platform/docs/02-backend-servicios/01-vertical-slices-api.md): Catalogo de endpoints REST, DTOs de entrada y salida, codigos de error y validaciones.
  - [`02-signalr-hubs.md`](file:///c:/Users/DESARROLLADOR/Desktop/Proyectos/delivery-platform/docs/02-backend-servicios/02-signalr-hubs.md): Especificacion de WebSocket Hubs (`KitchenHub` y `TrackingHub`) para cocina y seguimiento.
* **03. Base de Datos y Persistencia:**
  - [`01-modelo-datos-postgis.md`](file:///c:/Users/DESARROLLADOR/Desktop/Proyectos/delivery-platform/docs/03-base-de-datos/01-modelo-datos-postgis.md): Diagrama ERD, modelo de poligonos SRID 4326, indice espacial GiST y snapshots de precios.
  - [`02-redis-geo-cache.md`](file:///c:/Users/DESARROLLADOR/Desktop/Proyectos/delivery-platform/docs/03-base-de-datos/02-redis-geo-cache.md): Telemetria de conductores con Redis GEO, llaves con TTL y cache de idempotencia.
* **04. Frontend y Experiencia de Usuario:**
  - [`01-estructura-route-groups.md`](file:///c:/Users/DESARROLLADOR/Desktop/Proyectos/delivery-platform/docs/04-frontend-web/01-estructura-route-groups.md): App Router en Next.js 16, Route Groups `(storefront)`, `(dashboard)`, `(driver)` y estado global Zustand.
  - [`02-pantalla-cocina-kds.md`](file:///c:/Users/DESARROLLADOR/Desktop/Proyectos/delivery-platform/docs/04-frontend-web/02-pantalla-cocina-kds.md): Tablero Kanban FIFO, semaforo de tiempos y sintetizador nativo Web Audio API.
  - [`03-pantalla-repartidor-gps.md`](file:///c:/Users/DESARROLLADOR/Desktop/Proyectos/delivery-platform/docs/04-frontend-web/03-pantalla-repartidor-gps.md): Transmision satelital continua, modo de simulacion para desarrollo y deep links a Waze / Google Maps.
* **05. Despliegue y Operaciones:**
  - [`01-infraestructura-docker.md`](file:///c:/Users/DESARROLLADOR/Desktop/Proyectos/delivery-platform/docs/05-despliegue-y-operaciones/01-infraestructura-docker.md): Especificacion de contenedores PostgreSQL + PostGIS y Redis 7 con healthchecks.
  - [`02-empaquetado-capacitor.md`](file:///c:/Users/DESARROLLADOR/Desktop/Proyectos/delivery-platform/docs/05-despliegue-y-operaciones/02-empaquetado-capacitor.md): Configuracion de Capacitor para generacion de la aplicacion movil Android / iOS.

---

## 2. Stack Tecnologico

| Capa | Tecnologia | Funcion Principal |
| :--- | :--- | :--- |
| **Backend** | .NET 8 (C# 12) | API de alto rendimiento con Vertical Slice Architecture |
| **Persistencia Espacial** | PostgreSQL 16 + PostGIS 3.4 | Geocercas vectoriales e indices espaciales GiST (SRID 4326) |
| **Cache y Telemetria** | Redis 7 Alpine | Redis GEO para conductores y almacenamiento de idempotencia |
| **Comunicacion en Vivo** | ASP.NET Core SignalR | Eventos push para comanderas de cocina y seguimiento cliente |
| **Tareas en Segundo Plano** | Hangfire | Procesamiento asincrono de facturacion electronica y notificaciones |
| **Frontend Web** | Next.js 16 (App Router + Turbopack) | Arquitectura unificada para Storefront, KDS de cocina y Repartidores |
| **Estado de Cliente** | Zustand + TanStack Query v5 | Persistencia en localStorage y cache de consultas de red |
| **Estilos y Componentes** | Tailwind CSS + Lucide Icons | Interfaz oscura de alto contraste y cero dependencias pesadas |
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

## 4. Puntos de Entrada de la Aplicacion Web

* **Storefront y Menu Comercial:** `http://localhost:3005/`
* **Checkout con Resolucion de Cobertura:** `http://localhost:3005/checkout`
* **Seguimiento del Pedido en Vivo:** `http://localhost:3005/track/<order-uuid>`
* **Pantalla de Cocina (KDS en Tiempo Real):** `http://localhost:3005/kitchen`
* **Herramienta del Repartidor con Transmision GPS:** `http://localhost:3005/active-delivery`
