# Memoria Local del Proyecto — Mesafy

## 1. Arquitectura Backend: Vertical Slice Architecture (VSA) Estricta
* **Autonomía por Slice:** Cada funcionalidad en `backend/src/Delivery.Features/` encapsula su propio `*Endpoint.cs` (implementando `IEndpoint`), `*Handler.cs`, comandos/consultas, validadores FluentValidation y DTOs. Queda prohibido que un slice referencie tipos de otro slice.
* **Prohibición de Controladores Horizontales:** Prohibido crear carpetas o archivos de endpoints agrupados en `Delivery.Api/Endpoints/`. `Delivery.Api/Program.cs` mapea automáticamente todos los slices mediante `app.MapEndpoints()`.
* **Inyección de Dependencias:** `AddDeliveryFeatures()` auto-registra por escaneo de ensamblado todos los handlers (`*Handler`), validadores y endpoints (`IEndpoint`). No requiere registros manuales en `DependencyInjection.cs`.
* **Framework Reference:** `Delivery.Features.csproj` contiene `<FrameworkReference Include="Microsoft.AspNetCore.App" />` para soporte nativo de Minimal APIs en cada slice.

## 2. Arquitectura Multi-Tenant y Personalización de Storefront
* **Resolución de Tenant (`TenantResolutionMiddleware`):** Prioriza el header explícito `X-Tenant-Slug` (con respuesta 404 RFC 7807 si se solicita un slug inexistente), seguido del claim JWT `tenant_id`, dominio personalizado (`TenantSettings.CustomDomain`), subdominio y fallback configurable (`la-granjita`).
* **Modelo de Personalización (`Tenant` y `TenantSetting`):**
  - `Tenant` almacena identidad visual (`Name`, `Tagline`, `Description`, `HeroSubtitle`, `LogoUrl`, `BrandPrimaryColor`, `BrandPrimaryHoverColor`, `BrandAccentColor`, `ContactPhone`, `ContactEmail`).
  - `TenantSetting` almacena tarifas y operación (`BaseDeliveryFee`, `EnableDelivery`, `EnableTakeout`, `EnableDineIn`, `AcceptsCash`, `AcceptsBankTransfer`, `AcceptsCard`, datos bancarios) y configuración JSON de landing (`HeroSlidesJson`, `PromotionalBannersJson`, `QuickLinksEnabled`).
* **Vertical Slices de Tenants y Sucursales:**
  - `GET /api/tenants`: Directorio público de negocios activos (`GetPublicTenants`).
  - `GET /api/tenants/current`: Configuración completa del storefront y sucursales del tenant resuelto (`GetCurrentTenant`).
  - `PUT /api/tenants/current/storefront`: Actualización en vivo de identidad, colores, hero slides, banners promocionales, tarifas y cuenta bancaria (`UpdateTenantStorefront`).
  - `GET /api/branches`: Listado de sucursales y coordenadas PostGIS del tenant activo (`GetBranches`).
* **Semillas Multi-Tenant (`DatabaseSeeder`):** Siembra dos negocios independientes (`la-granjita` con sucursal única en Guamaní y `brasas-del-valle` con Matriz Cumbayá) con paletas de colores, geocercas PostGIS, catálogos, cuentas bancarias y landings diferenciadas. El seeder limpia automáticamente de forma idempotente sucursales obsoletas sin pedidos en bases de datos existentes. Soporta aprovisionamiento dinámico de nuevos comercios desde la consola SuperAdmin (`/superadmin`).
* **Estado y Temas Dinámicos en Frontend (`src/features/tenant/`):**
  - `TenantThemeProvider` inyecta `--brand-primary`, `--brand-primary-hover` y `--brand-accent` en `:root` y sincroniza el contexto del carrito.
  - `useCartStore` particiona los carritos, sucursales y tarifas de envío en `cartsByTenant` por `tenantSlug` para impedir colisiones en `localStorage`.
  - Panel de personalización modular disponible en `/admin/personalizacion` (`StorefrontCustomizerView`, `StorefrontBrandingSection`, `StorefrontOperationsSection`, `HeroSlidesEditor`, `PromoBannersEditor`), con estricto límite inferior a 400 líneas por componente.
  - Gestión reactiva de capacidades operativas mediante TanStack Query en `BranchManagementView` con sondeo automático a 30 segundos y cero efectos en cascada.

## 3. Enrutamiento Canónico Multi-Tenant y Multi-Sucursal (`tenant-routing.ts`)
* **Motor Centralizado de Enrutamiento (`resolveTenantRouting` / `useTenantRoutes`):**
  - Ubicado en `frontend/src/shared/lib/tenant-routing.ts`. Provee una única fuente de verdad para generar URLs en todos los contextos: vitrina, login, registro, checkout, rastreo de pedidos, sucursales, terminales KDS, repartidores y paneles administrativos.
  - Prioridad determinística de resolución de slug: `explicitSlug` > `pathSlug` (segmento de ruta `/[slug]`) > `subdomain` (si el host pertenece a dominios base de la plataforma) > `storeSlug` (store Zustand) > fallback `DEFAULT_TENANT_SLUG`.
* **Soporte Nativo de 4 Contextos de Red:**
  1. *Host de Plataforma con Prefijo (`localhost:3005/[slug]`, `mesafy.com/[slug]`):* Vitrina y rutas operativas bajo `/[slug]` (`/[slug]/login`, `/[slug]/checkout`, `/[slug]/cocina`, `/[slug]/repartidor`, `/[slug]/admin/*`). La raíz `/` es el portal global multimarca `PlatformLandingView`.
  2. *Dominio Propio / Custom Domain (`pedidos.lagranjita.com`, `mirestaurante.ec`):* Rutas limpias sin prefijos redundantes (`/login`, `/rastreo`, `/checkout`, `/cocina`). El cliente HTTP añade la cabecera `X-Tenant-Domain`.
  3. *Subdominio de Plataforma (`la-granjita.mesafy.com`):* Rutas limpias idénticas al dominio propio.
  4. *Rutas y Parámetros de Sucursales:* Soporte nativo para rutas directas `/[slug]/sucursal/[branchId]`, `/[slug]/sucursales/[branchId]`, `/sucursal/[branchId]`, `/sucursales/[branchId]` y query parameters `?branch=...` / `?sucursal=...` sincronizados con `useCartStore` vía `BranchSync`.
* **Compatibilidad Next.js 16 Partial Prerendering (PPR):**
  - Componentes que consumen hooks dinámicos del cliente (`usePathname()`, `useSearchParams()`) están encapsulados en límites `<Suspense>`.
  - Rutas dinámicas basadas en `params` Promise de Next.js 16 separan la resolución asíncrona dentro de componentes cargadores envueltos en `<Suspense>`, garantizando prerenderizado estático de 55 páginas sin errores.
* **Modularización del Storefront Layout (< 400 líneas):**
  - `StorefrontHeader.tsx` (326 líneas), `StorefrontFooter.tsx` (215 líneas), `MobileBottomNav.tsx` (135 líneas) y `layout.tsx` (28 líneas).
