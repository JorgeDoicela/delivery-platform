# 03. Herramienta Móvil del Repartidor y Telemetría GPS

## 1. Descripción General
El módulo de repartidor (`src/app/(driver)/repartidor/page.tsx` y `src/app/(driver)/active-delivery/page.tsx`) proporciona una interfaz táctil optimizada para teléfonos móviles y terminales portátiles, dirigida a motorizados y repartidores de la plataforma Mesafy.

El sistema unifica la recepción de pedidos listos en cocina, la navegación asistida hacia el domicilio del cliente, la telemetría GPS satelital en tiempo real transmitida a Redis GEO y SignalR, y la liquidación contable del turno y cobro en efectivo.

---

## 2. Arquitectura de Componentes y Estado

```
src/features/tracking/
├── components/
│   ├── DriverDeliveryView.tsx     # Shell principal con navegación por pestañas táctiles
│   ├── DriverHeader.tsx           # Cabecera con disponibilidad, datos del vehículo y métricas
│   ├── ActiveDeliveryTab.tsx      # Hoja de ruta activa, mapa MapLibre, cobro y deep links
│   ├── AvailableOrdersTab.tsx     # Bandeja de comandas listas en cocina para autoasignación
│   ├── ShiftSummaryTab.tsx        # Liquidación de turno, efectivo en mano e historial
│   ├── DriverMarker.tsx           # Marcador vectorial animado del motorizado con orientación
│   ├── OrderMap.tsx               # Renderizado vectorial WebGL con MapLibre GL JS
│   ├── OrderSearchView.tsx        # Buscador de pedidos por UUID para clientes
│   ├── OrderTrackingView.tsx      # Pantalla B2C de seguimiento satelital para el comensal
│   └── StatusTimeline.tsx         # Línea de tiempo visual del avance de la orden
├── hooks/
│   ├── useDriverTracking.ts       # Hook de telemetría continua a Redis GEO y simulación
│   ├── useDriverHub.ts            # Conexión SignalR a /hubs/kitchen para alertas sonoras y cambios
│   └── useOrderTracking.ts        # Hook de suscripción SignalR para clientes
└── store/
    └── useDriverStore.ts          # Store Zustand del repartidor (pedidos, turno y selección)
```

---

## 3. Endpoints Backend Integrados (.NET 8 VSA)

El módulo interactúa con los siguientes endpoints en `backend/src/Delivery.Features/Drivers/`:

| Método | Ruta | Slice Backend | Propósito |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/driver/me` | `GetDriverProfile` | Recupera datos operativos del repartidor, vehículo y métricas acumuladas del turno. |
| `PUT` | `/api/driver/status` | `UpdateDriverStatus` | Conmuta la disponibilidad del motorizado (`isAvailable`) y actualiza vehículo/placa. |
| `GET` | `/api/driver/orders` | `GetDriverOrders` | Obtiene comandas clasificadas (`ActiveOrders`, `AvailableOrders`, `DeliveredToday`) y resumen contable. |
| `POST` | `/api/driver/orders/{orderId}/claim` | `ClaimDriverOrder` | Asigna la orden al repartidor, cambia el estado a `OnTheWay` y notifica a cocina y comensal vía SignalR. |
| `POST` | `/api/tracking/driver-location` | `IngestDriverLocation` | Ingesta de latitud, longitud y rumbo (`heading`) en Redis GEO con TTL de 20 minutos. |
| `PUT` | `/api/orders/{orderId}/status` | `UpdateOrderStatus` | Transición final a `Delivered` tras completar la entrega y cobro. |

---

## 4. Flujo Operativo y Pestañas del Módulo

### 4.1. Cabecera y Disponibilidad (`DriverHeader.tsx`)
* Muestra el nombre del repartidor, tipo de vehículo (Moto/Auto), placa y sucursal.
* Botón de conmutación de turno:
  - **Disponible:** Habilitado para recibir y tomar nuevos pedidos.
  - **En Pausa:** Detiene la asignación de nuevas rutas.
* Indicadores numéricos inmediatos: cantidad de pedidos completados hoy y total de efectivo en mano a liquidar.

### 4.2. Pestaña 1: "Entrega en Curso" (`ActiveDeliveryTab.tsx`)
* Diseñada para operar mientras el motorizado está en ruta:
  - Si existen múltiples entregas asignadas, barra horizontal para alternar entre pedidos.
  - Detalle del cliente: nombre, dirección completa, referencias y botón directo de llamada telefónica (`tel:`).
  - Notas especiales de entrega (ej. "Tocar timbre 2B", "Dejar en garita").
  - Desglose de productos con sus modificadores para verificación en la entrega.
  - Módulo de cobro:
    - **Efectivo:** Total exacto, valor pagado por el cliente y cálculo automático de cambio a entregar.
    - **Digital:** Indicador explícito de comanda pagada para evitar cobros erróneos al cliente.
  - Telemetría GPS en tiempo real:
    - Emisión periódica de coordenadas mediante Geolocation API o modo simulación para pruebas locales.
    - Mapa integrado MapLibre GL JS con marcadores vectoriales de origen, destino y motorizado.
  - Enlaces profundos de navegación:
    - **Google Maps:** `https://www.google.com/maps/dir/?api=1&destination={lat},{lng}`
    - **Waze:** `https://waze.com/ul?ll={lat},{lng}&navigate=yes`
  - Botón de confirmación táctil: Registra la entrega en el servidor, detiene la telemetría del pedido y transfiere la orden al historial de liquidados.

### 4.3. Pestaña 2: "Disponibles en Cocina" (`AvailableOrdersTab.tsx`)
* Muestra la lista de comandas listas para despacho (`ReadyForDelivery`) preparadas por la cocina.
* Cada tarjeta muestra la hora de preparación, sucursal, productos, dirección y método de cobro.
* Botón **"Tomar Pedido"**: Asigna la orden de forma atómica mediante `claimDriverOrder`, la transfiere a la pestaña de "En Curso" y activa el seguimiento GPS.
* Conexión SignalR (`useDriverHub`): Emite una alerta sonora Web Audio (`kitchenAlertSound.playNewOrderChime`) cuando la cocina finaliza una orden.

### 4.4. Pestaña 3: "Turno y Liquidación" (`ShiftSummaryTab.tsx`)
* Métricas acumuladas del día:
  - Total de pedidos entregados.
  - Total de efectivo recaudado en mano (con advertencia de entrega en caja).
  - Ganancias acumuladas por tarifa de despacho.
* Historial cronológico inverso de entregas realizadas en la jornada, indicando hora, cliente, dirección, método de pago y monto.
* Ficha técnica del repartidor y datos de registro del vehículo.

---

## 5. Pruebas y Verificación

El módulo cuenta con cobertura completa de pruebas automatizadas:
* Backend: `Delivery.UnitTests.Features.Drivers.DriverHandlerTests` (validación de perfiles, permisos, transiciones de estado, aislamiento de sucursal y cálculo de liquidación).
* Frontend: `src/shared/lib/api-client.test.ts` (contratos HTTP y manejo de errores RFC 7807) y `src/features/tracking/store/useDriverStore.test.ts` (máquina de estados Zustand, reclamo de órdenes y cálculo de efectivo en mano).

---

## Navegación de Documentación
* **Anterior:** [02. Pantalla de Cocina y Kitchen Display System (KDS)](./02-pantalla-cocina-kds.md)
* **Siguiente:** [04. Sistema de Diseño y Temas](./04-sistema-de-diseno-y-temas.md)
* **Índice General:** [README Principal](../../README.md)
