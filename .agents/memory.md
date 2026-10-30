# Memoria Local del Proyecto — Delivery Platform

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
* **Semillas Multi-Tenant (`DatabaseSeeder`):** Siembra tres negocios independientes (`la-granjita`, `brasas-del-valle`, `el-lenador`) con paletas de colores, geocercas PostGIS, catálogos, cuentas bancarias y landings diferenciadas.
* **Estado y Temas Dinámicos en Frontend (`src/features/tenant/`):**
  - `TenantThemeProvider` inyecta `--brand-primary`, `--brand-primary-hover` y `--brand-accent` en `:root` y sincroniza el contexto del carrito.
  - `useCartStore` particiona los carritos, sucursales y tarifas de envío en `cartsByTenant` por `tenantSlug` para impedir colisiones en `localStorage`.
  - Panel de personalización modular disponible en `/admin/personalizacion` (`StorefrontCustomizerView`, `StorefrontBrandingSection`, `StorefrontOperationsSection`, `HeroSlidesEditor`, `PromoBannersEditor`), con estricto límite inferior a 400 líneas por componente.
  - Gestión reactiva de capacidades operativas mediante TanStack Query en `BranchManagementView` con sondeo automático a 30 segundos y cero efectos en cascada.
