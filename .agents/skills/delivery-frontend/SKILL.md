---
name: delivery-frontend
description: Extensión local de arquitectura frontend e ingeniería de interfaces multi-tenant para Delivery Platform (Next.js 16+ App Router, Feature-Driven design en src/features/, aislamiento por ruta /[slug], MapLibre GL JS, Zustand, SignalR, PWA y cero parches).
---
# Directrices de Desarrollo Frontend para Delivery Platform (Next.js Multi-Tenant)

Esta habilidad define los estándares de arquitectura, enrutamiento multi-tenant, patrones de diseño de componentes y gestión de estado para la aplicación web y móvil unificada de Delivery Platform.

---

## 1. Arquitectura de Código: Feature-Driven Design

Toda la lógica de negocio, componentes, contratos y estado se organiza estrictamente en `src/features/`:
* `src/features/platform/`: Landing principal de la plataforma (`PlatformLandingView`), directorio público de restaurantes afiliados, formulario de auto-afiliación y consola global `/superadmin` (`SuperAdminConsoleView`).
* `src/features/tenant/`: Resolución y estado del establecimiento activo (`useTenantStore`), inyección dinámica de CSS tokens (`TenantBrandThemeInjector`), conmutador de restaurantes (`TenantSwitcher`) y panel de personalización de marca (`/admin/personalizacion`).
* `src/features/catalog/`: Tienda individual de cada restaurante (`RestaurantStorefrontView`), plantillas intercambiables (`asadero-clasico`, `steakhouse-gourmet`, `fast-casual-urbano`) o layouts personalizados por `slug`, productos, combos, modificadores y gestión de inventario (`/admin/inventario`).
* `src/features/cart/`: Estado global del pedido (`useCartStore`) con Zustand, persistencia en LocalStorage y aislamiento automático por `tenantSlug`.
* `src/features/checkout/`: Formularios de checkout con validación Zod (`checkoutSchema.ts`), validación PostGIS (`GeofenceChecker`) y selección interactiva de ubicación (`AddressSelector`).
* `src/features/tracking/`: Seguimiento en vivo por WebSockets, mapas vectoriales WebGL (`OrderMap`, `DriverMarker`) y stepper de estados (`StatusTimeline`).
* `src/features/kitchen/`: Tablero Kanban KDS, alarmas sonoras operativas y sincronización en tiempo real.

---

## 2. Segmentación Estricta de Rutas y Aislamiento Multi-Tenant

El App Router de Next.js (`src/app/`) separa los contextos operativos manteniendo la distinción innegociable entre la raíz de la plataforma y la tienda de cada establecimiento:

1. `(storefront)/`: Orientado a clientes, visitantes y comensales.
   - `/` (`src/app/(storefront)/page.tsx`): **Landing Principal Multi-Tenant de la Plataforma (`PlatformLandingView`)**. Muestra el directorio de todos los restaurantes afiliados y el flujo de registro de nuevos comercios. **Prohibido montar el catálogo de un restaurante individual en `/`.**
   - `/[slug]` (`src/app/(storefront)/[slug]/page.tsx`): **Tienda Individual del Restaurante (`RestaurantStorefrontView`)**. Carga el catálogo, sucursales, colores, logo, banners y plantilla del establecimiento identificado por `slug` (ej. `/la-granjita`, `/pizzeria-napoli`, `/sushi-kuro`).
   - `/sucursales`: Mapa y listado de sucursales y polígonos de cobertura del restaurante activo.
   - `/checkout`: Validación de geocerca, selección de dirección y confirmación de orden.
   - `/rastreo` y `/track/[orderId]`: Seguimiento en vivo con mapa y estado de orden.
   - `/login`: Acceso unificado para clientes y personal operativo del tenant.
2. `(dashboard)/`: Operaciones internas del restaurante y gobierno de plataforma.
   - `/cocina` (`/kitchen`): Tablero KDS con alarma sonora continua hasta aceptación manual.
   - `/admin/caja`: Control de turnos de caja, arqueo en efectivo y auditoría de cobros.
   - `/admin/inventario`: Creación, edición de productos con imagen propia (`ProductFormModal`) y conmutación de disponibilidad en tiempo real.
   - `/admin/personalizacion`: Configuración de colores, logo, plantilla de landing (`landingLayoutTemplate`), slides Hero y banners promocionales del restaurante.
   - `/superadmin`: Consola global para crear, activar/suspender y auditar cualquier restaurante afiliado.
3. `(driver)/`: Repartidores en smartphones.
   - `/repartidor` (`/active-delivery`): Hoja de ruta táctil, apertura de Waze/Google Maps y transmisión GPS en tiempo real.

---

## 3. Resolución de Tenant y Personalización por Establecimiento

* **Prioridad de Contexto (`src/shared/lib/tenant-context.ts`):**
  1. Si la URL actual corresponde a un restaurante (`/[slug]`), el `slug` de la ruta tiene prioridad absoluta sobre cualquier valor previo en `localStorage`.
  2. Si el usuario autenticado opera en `/cocina` o `/admin/*`, el `tenant_id` firmado en su JWT gobierna las mutaciones en el backend.
* **Arquitectura Híbrida de Plantillas y Layouts a Medida (`RestaurantStorefrontView.tsx`):**
  - Cada establecimiento puede elegir desde base de datos entre las plantillas incluidas (`asadero-clasico`, `steakhouse-gourmet`, `fast-casual-urbano`) o tener un componente React exclusivo en código asociado a su `slug` sin afectar a los demás restaurantes.

---

## 4. Puertos y Consumo de API

* **Puerto Frontend:** `3005` (Prohibido utilizar el puerto 3000 en cualquier archivo de configuración o script).
* **Puerto Backend API:** `5005` (`NEXT_PUBLIC_API_URL=http://localhost:5005`).
* **Canal WebSockets / SignalR:** `NEXT_PUBLIC_WS_URL=http://localhost:5005/hubs`.
* **Cliente HTTP Unificado:** Todas las peticiones deben realizarse a través de `apiClient` (`src/shared/lib/api-client.ts`), el cual inyecta automáticamente `X-Tenant-Slug` y `Authorization: Bearer` y encapsula el manejo de errores `ApiClientError`.

---

## 5. Mapas Vectoriales con MapLibre GL JS

* **Compatibilidad Turbopack y SSR:**
  - Prohibido importar `maplibregl` por defecto (`import maplibregl from 'maplibre-gl'`).
  - Utilizar siempre importaciones nombradas:
    ```typescript
    import { Map, Marker, Popup, NavigationControl, LngLatBounds, type StyleSpecification } from 'maplibre-gl';
    import 'maplibre-gl/dist/maplibre-gl.css';
    ```
* **Prevención de Fugas de Memoria WebGL:**
  - Almacenar las instancias en `useRef` y destruir explícitamente mapa y marcadores en la función de limpieza de `useEffect` (`map.remove()`).

---

## 6. Integración en Tiempo Real (SignalR)

* **Ciclo de Vida de Conexiones:**
  - Toda conexión SignalR debe crearse dentro de un `useEffect` y cerrarse limpiamente en su retorno (`connection.stop()`).
  - En cocina: `JoinBranchKitchen(branchId)` y `LeaveBranchKitchen(branchId)`.
  - En seguimiento: `JoinOrderTracking(orderId)` y `LeaveOrderTracking(orderId)`.
* **Manejo de Desconexiones:**
  - Configurar `.withAutomaticReconnect()` para tolerar reconexiones automáticas en redes móviles inestables.

---

## 7. Mandato de Calidad, Cero Parches y Conformidad con `delivery-estilos`

* **Tipado Estricto (Cero `any`):**
  - Todo modelo, propiedad, evento y respuesta de API debe tener un tipo o interfaz explícita. Los identificadores de orden (`orderId`) son cadenas UUID; prohibido convertirlos con `Number()`.
* **Gestión de los Cuatro Estados:**
  - Todo componente con carga asíncrona debe contemplar: `idle`, `loading`, `error` y `success`.
* **Regla de Límite de Componentes:**
  - Ningún componente debe superar las 400 líneas. Si excede ese umbral, debe dividirse en subcomponentes modulares.
* **Aplicación de Patrones Visuales (`delivery-estilos`):**
  - Toda vista nueva o modificada debe respetar el sistema de diseño documentado en `delivery-estilos` (tipografía dual `Barlow Condensed` + `Inter`, cifras tabulares `font-mono tabular-nums`, fondos limpios sin cajas pastel deslavadas, botones píldora `rounded-full` y cero iconos SVG decorativos redundantes), adaptando los patrones al propósito de cada ruta y al giro gastronómico de cada restaurante.
