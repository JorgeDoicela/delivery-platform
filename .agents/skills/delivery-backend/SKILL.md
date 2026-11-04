---
name: delivery-backend
description: Extensión local de arquitectura backend Multi-Tenant e ingeniería de software para Delivery Platform (.NET 8, VSA, aislamiento por TenantId, PostGIS NetTopologySuite, Redis 7 con ventanas de 20 min, SignalR Hubs, RFC 7807 y cero parches).
---
# Directrices de Desarrollo Backend para Delivery Platform (.NET 8 Multi-Tenant)

Esta habilidad define los estándares técnicos, aislamiento multi-tenant, decisiones de arquitectura y patrones de diseño específicos para el backend monolítico modular de **Delivery Platform**, capaz de operar múltiples restaurantes y franquicias de cualquier giro gastronómico de forma aislada.

---

## 1. Identidad de Arquitectura: Vertical Slice Architecture (VSA)

El backend opera bajo Vertical Slice Architecture estricta en .NET 8 (C# 12):
* **Ubicación:** `backend/src/Delivery.Features/`
* **Organización:** Cada funcionalidad agrupa en una única carpeta su comando o consulta, validador FluentValidation, manejador (`IHandler<TRequest, TResponse>`), endpoint (`IEndpoint`) y DTOs de entrada y salida:
  - `Tenants/CreateTenant/`: Aprovisionamiento transaccional completo de un nuevo restaurante (Tenant + Settings + Sucursal matriz con geocerca PostGIS + Categorías + Productos semilla + Modificadores + Usuario `TenantAdmin`).
  - `Tenants/GetPublicTenants/`, `GetPlatformTenants/`, `GetCurrentTenant/`, `UpdateTenantStorefront/`, `ToggleTenantStatus/`: Gobernanza multi-marca y personalización de tienda (colores, logo, plantillas, banners Hero y promos).
  - `Catalog/GetActiveMenu/`, `ToggleProductStatus/`, `UpsertProduct/`: Consulta de menú por establecimiento (`?includeInactive=true` para administración), activación/agotamiento en tiempo real y creación/edición de productos con imagen propia (`POST/PUT /api/catalog/products`).
  - `Orders/CreateOrder/`, `GetOrderById/`, `UpdateOrderStatus/`, `ApproveTransferOrder/`: Ciclo transaccional de órdenes con asignación de sucursal y throttling en Redis.
  - `Branches/ResolveBranch/`, `GetBranchCapacity/`, `GetBranches/`: Detección geométrica PostGIS de sucursal más cercana y consulta reactiva del estado de capacidad de cocina.
  - `Kitchen/GetActiveKitchenOrders/`: Comandas activas para tableros KDS aislados por sucursal y tenant.
  - `Tracking/IngestDriverLocation/`, `GetDriverLocation/`: Ingesta y distribución de telemetría GPS de repartidores.
  - `Auth/Login/`, `RefreshToken/`, `GetCurrentUser/`, `RevokeToken/`: Autenticación JWT con `tenant_id` embebido en los claims y rotación de Refresh Tokens en cookies `HttpOnly`.
* **Prohibición de Capas Horizontales:** Prohibido reintroducir carpetas globales de `Services`, `Managers` o controladores genéricos que fragmenten la lógica de un caso de uso.

---

## 2. Arquitectura Multi-Tenant y Aislamiento de Datos (`TenantId`)

1. **Entidades Aisladas (`ITenantEntity`) y Global Query Filters:**
   - Todas las entidades operativas (`Branch`, `Category`, `Product`, `BranchProduct`, `ModifierGroup`, `Order`, `CashShift`, `Driver`, `User`) implementan `ITenantEntity` (`Guid TenantId`).
   - `AppDbContext` aplica filtros globales automáticos (`HasQueryFilter(e => e.TenantId == CurrentTenantId)`) para impedir fugas de datos entre establecimientos.
   - El uso de `.IgnoreQueryFilters()` está estrictamente restringido a endpoints globales de gobernanza (`SuperAdmin`) o validaciones de unicidad global al crear un tenant.
2. **Resolución de Contexto (`TenantResolutionMiddleware`):**
   - **Rutas operativas/administrativas autenticadas:** El claim `tenant_id` firmado dentro del JWT tiene prioridad obligatoria (salvo rol `SuperAdmin`, que puede conmutar de comercio mediante `X-Tenant-Slug`).
   - **Rutas públicas de tienda y catálogo (`/api/tenants/current`, `/api/catalog/menu`, `/api/branches`):** El encabezado `X-Tenant-Slug` (o query `?tenant=`) tiene prioridad para que cualquier visitante o administrador logueado pueda navegar libremente por las tiendas públicas de distintos restaurantes.

---

## 3. Red, Puertos y Entorno de Ejecución

* **Puerto HTTP de API:** `5005` (Fijado para evitar conflictos con servicios en puerto 5000).
* **Puerto HTTPS de API:** `5006`
* **Base de Datos PostgreSQL + PostGIS:** Puerto `5432`, base de datos `delivery`.
* **Caché y Mensajería Redis:** Puerto `6379`, autenticado con contraseña.
* **Política CORS:** `AllowFrontend` autoriza `http://localhost:3005`, `http://127.0.0.1:3005` y el dominio de producción con credenciales habilitadas (`AllowCredentials`) y el encabezado `X-Tenant-Slug`.

---

## 4. Persistencia Espacial con PostGIS y NetTopologySuite

* **Modelo Geométrico por Sucursal:**
  - `Branch.LocationPoint`: Objeto `Point` (SRID 4326, WGS 84) representando las coordenadas de la sucursal.
  - `Branch.CoveragePolygon`: Objeto `Polygon` delimitando la geocerca de despacho.
* **Evaluación de Cobertura:**
  - Las consultas de despacho se ejecutan a nivel de motor de base de datos utilizando operadores espaciales indexados y filtrados automáticamente por el `TenantId` activo:
    ```csharp
    var branch = await dbContext.Branches
        .AsNoTracking()
        .Where(b => b.IsActive && b.CoveragePolygon.Contains(deliveryPoint))
        .OrderBy(b => b.LocationPoint.Distance(deliveryPoint))
        .FirstOrDefaultAsync(ct);
    ```
  - Prohibido realizar filtrados poligonales en memoria.

---

## 5. Throttling de Capacidad de Cocina en Redis

* **Algoritmo de Ranuras Temporales (20 Minutos):**
  - Fórmula de ventana temporal: `timestamp_20min = (UnixTimeSeconds / 1200) * 1200`.
  - Clave en Redis: `branch:{branchId}:slot:{timestamp_20min}` con TTL de 7200 segundos (2 horas).
* **Reglas de Concurrencia:**
  - Operación atómica de incremento: `INCR` (`StringIncrementAsync`).
  - Evaluación contra `branch.MaxOrdersPerSlot`:
    - `conteo <= max`: Despacho estándar.
    - `conteo > max` y `<= 1.5 * max`: Demanda alta. Se notifica extensión de tiempo de entrega (60-75 min).
    - `conteo > 1.5 * max`: Saturación crítica. Se decrementa atómicamente el contador (`DECR`) como compensación y se rechaza la transacción con error `Orders.SlotCapacityExceeded`.

---

## 6. Comunicación en Tiempo Real con SignalR

* **`KitchenHub` (`/hubs/kitchen`):**
  - Segmentación obligatoria por grupo de sucursal: `kitchen_branch_{branchId}`.
  - Métodos cliente: `JoinBranchKitchen(int branchId)` y `LeaveBranchKitchen(int branchId)`.
  - Eventos emitidos: `ReceiveNewOrder(KitchenOrderTicketDto ticket)` y `OrderStatusChanged(string orderId, string status)`.
* **`TrackingHub` (`/hubs/tracking`):**
  - Segmentación obligatoria por orden: `order_tracking_{orderId}`.
  - Métodos cliente: `JoinOrderTracking(string orderId)` y `LeaveOrderTracking(string orderId)`.
  - Eventos emitidos: `ReceiveDriverLocation(double latitude, double longitude, double? heading)`.

---

## 7. Manejo de Errores RFC 7807 y Calidad de Código

* **Middleware de Excepciones:** `ExceptionHandlingMiddleware` captura cualquier fallo no controlado y responde en formato RFC 7807 (`ProblemDetails`) con código HTTP apropiado.
* **Logging Zero-Allocation:** Utiliza delegados compilados en origen con `[LoggerMessage]`.
* **Manejo de Resultados:** Todas las operaciones de negocio retornan `Result<T>` o `Result` sin lanzar excepciones para flujo de control.
* **Prohibición de Parches:**
  - Prohibido el uso de bloques `catch` vacíos.
  - Prohibido el uso de tipos genéricos sin validación.
  - Prohibido consultas N+1: usar proyecciones `.Select()` directas a DTOs.
