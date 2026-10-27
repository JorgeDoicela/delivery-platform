---
name: delivery-backend
description: Extensión local de arquitectura backend e ingeniería de software para Delivery Platform (.NET 8, VSA, PostGIS NetTopologySuite, Redis 7 con ventanas de 20 min, SignalR Hubs, RFC 7807 y cero parches).
---
# Directrices de Desarrollo Backend para Delivery Platform (.NET 8)

Esta habilidad define los estándares técnicos, decisiones de arquitectura y patrones de diseño específicos para el backend monolítico modular de la plataforma de delivery para asaderos.

---

## 1. Identidad de Arquitectura: Vertical Slice Architecture (VSA)

El backend opera bajo Vertical Slice Architecture estricta en .NET 8 (C# 12):
* **Ubicación:** `backend/src/Delivery.Features/`
* **Organización:** Cada funcionalidad agrupa en una única carpeta su comando o consulta, validador FluentValidation, manejador MediatR y DTOs de entrada y salida:
  - `Orders/CreateOrder/`: Creación transaccional con asignación de sucursal y throttling.
  - `Orders/GetOrderById/`: Consulta de orden con desglose de ítems y modificadores.
  - `Orders/UpdateOrderStatus/`: Máquina de estados formal de órdenes.
  - `Branches/ResolveBranch/`: Detección geométrica PostGIS de sucursal más cercana.
  - `Branches/GetBranchCapacity/`: Consulta reactiva del estado de saturación del horno.
  - `Tracking/IngestDriverLocation/`: Ingesta y distribución de telemetría de repartidores.
* **Prohibición de Capas Horizontales:** Prohibido reintroducir carpetas globales de `Services`, `Managers` o controladores genéricos que fragmenten la lógica de un caso de uso.

---

## 2. Red, Puertos y Entorno de Ejecución

* **Puerto HTTP de API:** `5005` (Fijado para evitar conflictos con servicios médicos o concurrentes en puerto 5000).
* **Puerto HTTPS de API:** `5006`
* **Base de Datos PostgreSQL + PostGIS:** Puerto `5432`, base de datos `delivery`.
* **Caché y Mensajería Redis:** Puerto `6379`, autenticado con contraseña.
* **Política CORS:** `AllowFrontend` autoriza únicamente `http://localhost:3005`, `http://127.0.0.1:3005` y el dominio de producción `https://pedidos.delivery.com` con credenciales habilitadas (`AllowCredentials`).

---

## 3. Persistencia Espacial con PostGIS y NetTopologySuite

* **Modelo Geométrico:**
  - `Branch.LocationPoint`: Objeto `Point` (SRID 4326, WGS 84) representando las coordenadas de la sucursal.
  - `Branch.CoveragePolygon`: Objeto `Polygon` delimitando la geocerca de despacho.
* **Evaluación de Cobertura:**
  - Las consultas de despacho deben ejecutarse a nivel de motor de base de datos utilizando operadores espaciales indexados:
    ```csharp
    var branch = await dbContext.Branches
        .AsNoTracking()
        .Where(b => b.IsActive && b.CoveragePolygon.Contains(deliveryPoint))
        .OrderBy(b => b.LocationPoint.Distance(deliveryPoint))
        .FirstOrDefaultAsync(ct);
    ```
  - Prohibido realizar filtrados poligonales en memoria o aproximaciones por radio simple cuando la geocerca está definida como polígono irregular.

---

## 4. Throttling de Capacidad de Horno en Redis (Sección 9.4)

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

## 5. Comunicación en Tiempo Real con SignalR

* **`KitchenHub` (`/hubs/kitchen`):**
  - Segmentación obligatoria por grupo: `kitchen_branch_{branchId}`.
  - Métodos cliente: `JoinBranchKitchen(int branchId)` y `LeaveBranchKitchen(int branchId)`.
  - Eventos emitidos:
    - `ReceiveNewOrder(KitchenOrderTicketDto ticket)`: Emite el ticket completo con snapshots de productos y modificadores.
    - `OrderStatusChanged(string orderId, string status)`: Notifica transiciones de estado a las pantallas KDS.
* **`TrackingHub` (`/hubs/tracking`):**
  - Segmentación obligatoria por orden: `order_tracking_{orderId}`.
  - Métodos cliente: `JoinOrderTracking(string orderId)` y `LeaveOrderTracking(string orderId)`.
  - Eventos emitidos:
    - `ReceiveDriverLocation(double latitude, double longitude, double? heading)`: Transmisión continua a clientes suscritos.

---

## 6. Manejo de Errores RFC 7807 y Calidad de Código

* **Middleware de Excepciones:** `ExceptionHandlingMiddleware` captura cualquier fallo no controlado y responde en formato RFC 7807 (`ProblemDetails`) con código HTTP apropiado (500, 400, 404).
* **Logging Zero-Allocation:** Utiliza delegados compilados en origen con `[LoggerMessage]` para prevenir asignaciones de memoria y presión en el recolector de basura (GC).
* **Manejo de Resultados:** Todas las operaciones de negocio retornan `Result<T>` o `Result` indicando éxito o error sin lanzar excepciones para flujo de control.
* **Prohibición de Parches:**
  - Prohibido el uso de bloques `catch` vacíos.
  - Prohibido el uso de tipos genéricos sin validación.
  - Prohibido consultas N+1: usar proyecciones `.Select()` directas a DTOs.
