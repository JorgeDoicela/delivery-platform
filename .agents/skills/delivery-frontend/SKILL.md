---
name: delivery-frontend
description: Extensión local de arquitectura frontend e ingeniería de interfaces para Delivery Platform (Next.js 15+ App Router, Feature-Driven design en src/features/, MapLibre GL JS, Zustand, SignalR, PWA y cero parches).
---
# Directrices de Desarrollo Frontend para Delivery Platform (Next.js)

Esta habilidad define los estándares de arquitectura, patrones de diseño de componentes y gestión de estado para la aplicación web y móvil unificada de Delivery Platform.

---

## 1. Arquitectura de Código: Feature-Driven Design

Toda la lógica de negocio, componentes, contratos y estado se organiza estrictamente en `src/features/`:
* `src/features/catalog/`: Gestión del menú, categorías, productos, combos y opciones de modificadores.
* `src/features/cart/`: Estado global del pedido (`useCartStore`) con Zustand y persistencia en LocalStorage.
* `src/features/checkout/`: Formularios de checkout con validación Zod (`checkoutSchema.ts`), validación PostGIS (`GeofenceChecker`) y selección interactiva de ubicación (`AddressSelector`).
* `src/features/tracking/`: Seguimiento en vivo por WebSockets, mapas vectoriales WebGL (`OrderMap`, `DriverMarker`) y stepper de estados (`StatusTimeline`).
* `src/features/kitchen/`: Tablero Kanban KDS, alarmas sonoras operativas y sincronización en tiempo real.

---

## 2. Segmentación de Rutas y Roles

El App Router de Next.js (`src/app/`) separa tres contextos operativos independientes:
1. `(storefront)/`: Orientado a clientes y comensales.
   - `/`: Catálogo y combos de asadero.
   - `/checkout`: Validación de geocerca, selección de dirección y confirmación.
   - `/track/[orderId]`: Seguimiento en vivo con mapa y estado de orden.
2. `(dashboard)/`: Operaciones internas de restaurante.
   - `/kitchen`: Tablero KDS con alarma sonora continua hasta aceptación manual.
   - `/admin/branches`: Ajuste de geocercas poligonales y límites por ranura.
   - `/admin/inventory`: Conmutador de disponibilidad inmediata de productos.
3. `(driver)/`: Repartidores en smartphones.
   - `/active-delivery`: Hoja de ruta simplificada táctil, apertura de Waze/Google Maps y transmisión GPS en segundo plano.

---

## 3. Puertos y Consumo de API

* **Puerto Frontend:** `3005` (Prohibido utilizar el puerto 3000 en cualquier archivo de configuración o script).
* **Puerto Backend API:** `5005` (`NEXT_PUBLIC_API_URL=http://localhost:5005`).
* **Canal WebSockets / SignalR:** `NEXT_PUBLIC_WS_URL=http://localhost:5005/hubs`.
* **Cliente HTTP Unificado:** Todas las peticiones deben realizarse a través de `apiClient` (`src/shared/lib/api-client.ts`), el cual encapsula el tipado estricto de DTOs y el manejo de errores tipados `ApiClientError`.

---

## 4. Mapas Vectoriales con MapLibre GL JS

* **Compatibilidad Turbopack y SSR:**
  - Prohibido importar `maplibregl` por defecto (`import maplibregl from 'maplibre-gl'`).
  - Utilizar siempre importaciones nombradas:
    ```typescript
    import { Map, Marker, Popup, NavigationControl, LngLatBounds, type StyleSpecification } from 'maplibre-gl';
    import 'maplibre-gl/dist/maplibre-gl.css';
    ```
* **Prevención de Fugas de Memoria WebGL:**
  - En los componentes de mapa (`OrderMap`, `AddressSelector`), almacenar las instancias en `useRef` y destruir explícitamente mapa y marcadores en la función de limpieza de `useEffect` (`map.remove()`).
* **Estilo Resiliente:**
  - Consumir `NEXT_PUBLIC_MAP_STYLE_URL` con fallback nativo a mosaicos raster OpenStreetMap para garantizar operatividad sin costes por petición ni claves de API externas.

---

## 5. Integración en Tiempo Real (SignalR)

* **Ciclo de Vida de Conexiones:**
  - Toda conexión SignalR debe crearse dentro de un efecto React y cerrarse limpiamente en su retorno (`connection.stop()`).
  - Sincronizar unirse y abandonar canales:
    - En cocina: `JoinBranchKitchen(branchId)` y `LeaveBranchKitchen(branchId)`.
    - En seguimiento: `JoinOrderTracking(orderId)` y `LeaveOrderTracking(orderId)`.
* **Manejo de Desconexiones:**
  - Configurar `.withAutomaticReconnect()` para tolerar reconexiones automáticas en redes móviles inestables.

---

## 6. Mandato de Calidad y Cero Parches

* **Tipado Estricto (Cero `any`):**
  - Todo modelo, propiedad, evento y respuesta de API debe tener un tipo o interfaz explícita en `src/shared/types/api.ts`.
  - Los identificadores de orden (`orderId`) son cadenas UUID. Prohibido convertirlos con `Number()`.
* **Gestión de los Cuatro Estados:**
  - Todo componente con carga asíncrona debe contemplar: `idle`, `loading` (skeletons/spinners), `error` (mensajes contextuales y botón de reintento) y `success`.
* **Regla de Límite de Componentes:**
  - Ningún componente debe superar las 400 líneas. Si excede ese umbral, debe dividirse en subcomponentes modulares.
