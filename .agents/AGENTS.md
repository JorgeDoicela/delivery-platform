# Directrices del Proyecto Mesafy (AGENTS.md)

Este documento define las reglas de ingeniería de software, arquitectura Multi-Tenant, puertos asignados y estándares de calidad profesional obligatorios para cualquier agente o desarrollador que opere en este repositorio.

---

## 1. Identidad del Proyecto y Stack Tecnológico

Plataforma integral de gestión para restaurantes y solución Multi-Tenant (Mesafy) de pedidos en línea, terminales de salón/POS, gestión de cocina KDS, facturación electrónica y delivery geolocalizado en tiempo real para restaurantes, franquicias y comercios gastronómicos de cualquier especialidad (pizzerías, hamburgueserías, sushi, cafeterías, parrillas, asaderos y cocina de autor), diseñada con un frontend unificado y un backend monolítico modular de alto rendimiento.

* **Arquitectura Multi-Tenant:**
  - En Frontend: La raíz `/` (`PlatformLandingView`) es siempre el directorio y portal principal de la plataforma; cada establecimiento afiliado opera su propia tienda aislada en `/[slug]` (`RestaurantStorefrontView`) con su propia paleta de colores, logotipo, fotos, catálogo, sucursales y plantilla (`asadero-clasico`, `steakhouse-gourmet`, `fast-casual-urbano` o layout a medida por código).
  - En Backend y Base de Datos: Aislamiento estricto por `TenantId` mediante `ITenantEntity`, Global Query Filters en EF Core y `TenantResolutionMiddleware` (`tenant_id` en JWT para operaciones internas y `X-Tenant-Slug` para lectura pública de tiendas).
* **Backend:** .NET 8 (C# 12) Web API con Vertical Slice Architecture (VSA).
* **Persistencia:** PostgreSQL 16 + PostGIS (NetTopologySuite) para geocercas poligonales indexadas por sucursal.
* **Caché y Concurrencia:** Redis 7 (con throttling de capacidad de cocina por ranuras de 20 minutos).
* **Tiempo Real:** ASP.NET Core SignalR con grupos por sucursal (`kitchen_branch_{branchId}`) y por orden (`order_tracking_{orderId}`).
* **Frontend:** Next.js (App Router) con React 19, TypeScript estricto y Tailwind CSS.
* **Mapas:** MapLibre GL JS (renderizado vectorial WebGL sin coste por petición).
* **Audio Operativo:** Howler.js (reproducción en bucle en terminales de cocina KDS).
* **Gestión de Estado:** Zustand con persistencia en LocalStorage aislada por `tenantSlug`.
* **Validación:** FluentValidation en backend y React Hook Form con Zod en frontend.

---

## 2. Mapa Estricto de Puertos y Servicios

Queda estrictamente prohibido cambiar los puertos asignados sin previa autorización y análisis de impacto en contratos:

| Servicio | Puerto Local | Protocolo | Variable de Entorno | Observaciones |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend Web** | `3005` | HTTP | `PORT=3005` | Prohibido puerto 3000 |
| **Backend API** | `5005` | HTTP | `API_PORT=5005`, `API_URL` | Puerto 5000 reservado para otros servicios |
| **Backend API (SSL)** | `5006` | HTTPS | N/A | Perfil HTTPS en `launchSettings.json` |
| **PostgreSQL + PostGIS** | `5432` | TCP | `POSTGRES_PORT=5432` | Base de datos: `delivery` |
| **Redis** | `6379` | TCP | `REDIS_PORT=6379` | Requiere autenticación |
| **WebSockets / SignalR** | `5005` | WS / WSS | `NEXT_PUBLIC_WS_URL` | Rutas: `/hubs/kitchen`, `/hubs/tracking` |

---

## 3. Matriz de Invocación de Skills

Ante cualquier intervención en el repositorio, el agente debe consultar y ceñirse a las directrices de las skills especializadas:

| Área de Trabajo | Skill Local Primaria | Skill Global Complementaria | Propósito |
| :--- | :--- | :--- | :--- |
| **Backend, APIs y Base de Datos** | `delivery-backend` | `desarrollo-backend` | VSA, aislamiento Multi-Tenant (`TenantId`), PostGIS, Redis, SignalR y middlewares. |
| **Frontend, Rutas y Componentes** | `delivery-frontend` | `desarrollo-frontend` | App Router (`/` vs `/[slug]`), Feature-Driven design, Zustand, SignalR y MapLibre. |
| **Diseño Visual, UI/UX y Estilos** | `delivery-estilos` | `desarrollo-frontend` | Patrones visuales reutilizables, tokens dinámicos por tenant, tipografía dual, ergonomía táctil y WCAG. |
| **Documentación y Dosieres** | `delivery-documentacion` | `documentacion` | Sincronización proactiva continua ante cambios sustanciales, taxonomía numérica, cero emojis y rutas dinámicas. |
| **Infraestructura, Docker y SO** | N/A | `sysadmin` | Docker Compose, PostgreSQL, Redis y scripts PowerShell. |
| **Credenciales y Configuración** | N/A | `datos-seguros` | Secretos JWT, contraseñas de BD y variables de entorno. |

---

## 4. Estándar Senior Innegociable y Cero Parches

1. **Causa Raíz en su Origen:** Prohibido aplicar parches cosméticos, bloques `catch` vacíos o mutaciones de estado impredecibles.
2. **Tipado Estricto:**
   - En C#: Cero uso de `dynamic` o castings forzados no seguros.
   - En TypeScript: Cero uso de `any`. Los identificadores de pedido (`orderId`) son cadenas UUID estrictas; prohibido convertirlos a `Number()`.
3. **Gestión de Estados Completa:** Toda vista asíncrona debe implementar los cuatro estados: `idle`, `loading` (skeletons), `error` (mensajes contextuales y reintento) y `success`.
4. **Límite de Tamaño de Archivo:** Ningún componente o clase de servicio debe superar las 400 líneas. Extraer a submódulos cuando se alcance dicho límite.
5. **Tono Sobrio y Profesional:** Cero emojis y cero lenguaje publicitario o inflado en código, documentación y commits.
6. **Estructura de Scripts Operativos (`scripts/`):** Todo script de automatización, despliegue o mantenimiento debe ubicarse en la raíz `scripts/` clasificado por su dominio (ej. `scripts/deploy/` para CI/CD y rollback, `scripts/db/` para semillas o respaldos). Prohibido crear scripts sueltos en la raíz o carpetas sin categorizar.

---

## 5. Control de Calidad Pre-Commit (Husky v9)

El repositorio cuenta con hooks de pre-commit automatizados y selectivos en `.husky/pre-commit`:
* **Frontend:** Si el commit incluye archivos `.ts`, `.tsx`, `.js` o `.jsx`, ejecuta automáticamente el linter de ESLint (`pnpm --filter frontend lint`) y la suite de pruebas unitarias (`pnpm --filter frontend test`).
* **Backend:** Si el commit incluye archivos `.cs` o `.csproj`, ejecuta la compilación y pruebas completas de la solución (`dotnet test backend/Delivery.sln -v q -nologo`).
* **Inmutabilidad de la Regla:** Queda prohibido eludir el pre-commit con `--no-verify` salvo autorización expresa del desarrollador. Todo commit debe entrar con 0 errores y 0 advertencias.
