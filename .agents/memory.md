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

## 4. Responsividad Móvil Universal y Barras Inferiores Fijas (Mobile Bottom Navs)
* **Storefront (`(storefront)`):** Barra fija inferior `MobileBottomNav.tsx` con accesos rápidos a Inicio, Menú, Locales, Rastreo, Bolsa y Perfil; se oculta automáticamente en `/checkout` y `/finalizar-pedido` para dar paso a la barra fija de confirmación. `StorefrontFooter` cuenta con `pb-20 xl:pb-0` para prevenir solapamiento.
* **Checkout Móvil de Alta Conversión (`CheckoutForm.tsx`):** Dock fijo inferior en pantallas móviles (`fixed bottom-0` con `env(safe-area-inset-bottom)`) que mantiene visible el resumen de artículos, importe total y botón píldora "Confirmar Pedido", eliminando la necesidad de desplazarse hasta el final del formulario.
* **Dashboard de Operaciones Modularizado (`(dashboard)`):**
  - `layout.tsx` refactorizado de 471 líneas a 134 líneas dividiéndose en `DashboardHeader.tsx`, `DashboardMobileDrawer.tsx` y `DashboardBottomNav.tsx`.
  - `DashboardBottomNav.tsx` ofrece navegación táctil inmediata para Cocina KDS, Inventario/Stock, Sucursales, Marca y Gobernanza SuperAdmin con `pb-24 md:pb-6` en el canvas principal.
* **Reparto Móvil (`(driver)`):** Incorporación de `DriverBottomNav.tsx` para alternar instantáneamente con el pulgar entre "En Ruta", "Cocina" (con badge numérico de comandas listas) y "Mi Turno", además de acceso directo a la tienda pública.
* **Inventario Modularizado (`InventoryManagerView.tsx`):** Reducido a 334 líneas extrayendo `InventoryDesktopTable.tsx` (174 líneas) y preservando tarjetas móviles táctiles con botones de acción superiores a 42px.
* **Sincronización en Tiempo Real Continua (Cero Botones Manuales de Recarga):**
  - Causa Raíz Erradicada: El botón manual de recarga en la cabecera del repartidor (`DriverHeader.tsx`) existía porque `useDriverHub.ts` fallaba al conectar a `/hubs/kitchen` al no enviar el JWT `accessTokenFactory` y porque el Hub requería la política restrictiva `KitchenOnly`.
  - Backend Unificado (`KitchenHub.cs`): Autorización ampliada a `[Authorize(Policy = "OperationalStaffOnly")]`, permitiendo que cocineros, cajeros, administradores y repartidores se conecten a los eventos de su sucursal (`kitchen_branch_{branchId}`) en tiempo real.
  - Repartidor Reactivo (`DriverHeader.tsx`, `useDriverHub.ts`, `DriverDeliveryView.tsx`): Botón manual con icono `RefreshCw` eliminado por completo. Reemplazado por suscripción SignalR con `accessTokenFactory`, reconexión automática (`withAutomaticReconnect`), refresco instantáneo ante `OrderStatusChanged` (ej. `ReadyForDelivery` con timbre sonoro) y fallback resiliente cada 25s al enfocar la app (`visibilitychange`). Badge visual "En Vivo" / "Reconectando".
  - Pantalla KDS (`KitchenView.tsx`, `useKitchenOrders.ts`): Botón redundante de "Refrescar" eliminado. Conexión WebSocket blindada con `accessTokenFactory`, suscripción a `JoinBranchKitchen`, reconexión y fallback de 20s. Badge de estado "En Vivo • KDS".
  - Sucursales y Redis (`BranchManagementView.tsx`): Botón manual "Refrescar" eliminado. Sustituido por `refetchInterval: 15000` con `refetchOnWindowFocus: true` en React Query y badge "Monitoreo en Vivo" con marca temporal.
  - Catálogo e Inventario (`useMenuQuery.ts`): Sincronización reactiva con `refetchOnWindowFocus: true` y `refetchInterval: 30000` en modo administración (`includeInactive = true`).
  - Gobernanza SaaS (`PlatformTenantsGovernanceView.tsx`): Botón manual "Actualizar" eliminado en favor de `refetchInterval: 30000`, `refetchOnWindowFocus: true` y badge "En Línea".
  - Redirección Determinista (`resolvePostLoginRedirect` en `redirectByRole.ts`): Impide que clientes (`Customer`) sean redirigidos a rutas operativas (`/cocina`, `/admin`, `/superadmin`, `/repartidor`). Despacha a cada rol a su consola primaria (`SuperAdmin` -> `/superadmin`, `TenantAdmin` -> `/admin/personalizacion`, `BranchManager` -> `/admin/inventario`, `KitchenStaff`/`Cashier` -> `/cocina`, `Driver` -> `/repartidor`, `Customer` -> `/`).
  - Aislamiento Multi-Tenant en Frontend (`AuthGuard.tsx`): Verifica que el usuario pertenezca al `activeTenantSlug` de la URL salvo excepciones de rol transversal (`SuperAdmin`). Bloquea con pantalla sobria de "Comercio no autorizado" con CTA de redirección hacia su propio establecimiento.
  - Anclaje de Sucursal en KDS (`KitchenView.tsx`): El personal de cocina o caja asignado a una sucursal (`user.branchId`) visualiza un indicador fijo sin permiso para conmutar sucursales ajenas; la conmutación entre locales queda reservada a `BranchManager`, `TenantAdmin` y `SuperAdmin`.
  - Navegación Dinámica por Rol (`DashboardHeader`, `DashboardBottomNav`, `DashboardMobileDrawer`, `StorefrontHeader`, `StorefrontMobileDrawer` y `login/page.tsx`): "Marca & Landing" restringido exclusivamente a `TenantAdmin` y `SuperAdmin`. Los botones en el perfil reflejan con exactitud las atribuciones de los 7 roles del dominio gastronómico.
  - Límite de 400 Líneas Preservado: `StorefrontHeader.tsx` (263 líneas) modularizado extrayendo `StorefrontMobileDrawer.tsx` (234 líneas).

## 5. Eliminación Estricta de Duplicidad de Controles y Botones de Navegación
* **Principio de Única Fuente de Control por Dispositivo:** Queda estrictamente prohibido presentar pestañas, botones o enlaces duplicados simultáneamente entre cabeceras, barras flotantes inferiores y cuerpos de vista.
* **Repartidor (`DriverDeliveryView.tsx` vs `DriverBottomNav.tsx`):**
  - La barra de pestañas superior en cápsula (`[ En Curso ]` `[ Cocina ]` `[ Turno ]`) se oculta en móviles mediante `hidden sm:flex`.
  - En móviles (`< sm`), `DriverBottomNav` es la única interfaz de control táctil con badges en tiempo real. En tablets y escritorio (`>= sm`), la cápsula superior toma el control y la barra inferior permanece oculta (`sm:hidden`).
  - Se aplicó padding inferior `pb-24 sm:pb-10` en el contenedor y márgenes adecuados en `ActiveDeliveryTab.tsx` para evitar colisiones con docks fijos.
* **Paneles de Operaciones (`DashboardMobileDrawer.tsx` vs `DashboardBottomNav.tsx`):**
  - `DashboardBottomNav.tsx` es el canal primario de acceso a módulos (`KDS`, `Stock`, `Locales`, `Marca`, `Admin`, `Tienda`).
  - En `DashboardMobileDrawer.tsx` se eliminó la lista redundante de módulos operativos. El drawer se destina exclusivamente a gestión de entorno y preferencias: `TenantSwitcher` para SuperAdmin, indicadores de alerta sonora KDS, modo pantalla completa, acceso a tienda y cambio de tema con `ThemeToggle`.
* **Vitrina Pública (`StorefrontMobileDrawer.tsx` vs `MobileBottomNav.tsx`):**
  - `MobileBottomNav.tsx` centraliza la navegación habitual (`Inicio`, `Menú`, `Locales`, `Rastreo`, `Bolsa`, `Perfil`).
  - `StorefrontMobileDrawer.tsx` provee enlaces complementarios que no saturan el dock inferior: `Sucursales & Cobertura`, `Términos y Condiciones`, `Aviso de Privacidad` y selector dinámico de sucursales en pantallas reducidas.

## 6. Telemetría Geoespacial del Repartidor (PostGIS + Redis GEO + SignalR)
* **División de Responsabilidades:**
  - PostGIS (PostgreSQL 16 + NetTopologySuite): Persistencia de `Order.DeliveryLocation` (`Point`), geocercas poligonales de sucursales (`Branch.DeliveryPolygon`) con índice espacial GIST y validación de cobertura (`ST_Contains`).
  - Redis 7 GEO: Ingesta efímera de alta frecuencia (`GEOADD active_drivers:locations`) y rumbo (`driver:{driverId}:heading`) para no saturar PostgreSQL con escrituras masivas cada 3 segundos.
  - SignalR (`TrackingHub`): Retransmisión push de `ReceiveDriverLocation` al grupo `order_tracking_{orderId}`.
* **Carga Inmediata y Resiliencia en Cliente (`useOrderTracking.ts`):**
  - Al montar la vista de rastreo o cambiar la orden a `OnTheWay`, se consulta inmediatamente `apiClient.getDriverLocation(orderId)` (Redis GEO) para pintar al motorizado en el mapa desde el primer milisegundo sin esperar al siguiente pulso de SignalR.
  - Mantiene la suscripción a eventos WebSocket de SignalR para movimiento continuo y rotación según rumbo (`heading`).
* **Experiencia de Usuario de Extremo a Extremo (Checkout -> Despacho -> Rastreo):**
  - Checkout Inteligente (`CheckoutForm.tsx`): Pre-llenado automático de nombre y correo electrónico si el usuario ha iniciado sesión, eliminando fricción.
  - Geolocalización de Destino (`GeofenceChecker.tsx`): Detección satelital vía GPS nativo o selección visual con pin arrastrable sobre MapLibre GL JS, validado contra el polígono PostGIS de la sucursal (`ST_Contains`).
  - Mapa Completo Origen-Destino (`OrderMap.tsx`): `GetOrderById` expone `BranchLatitude` y `BranchLongitude` permitiendo renderizar tanto el local de origen como el domicilio de entrega desde el momento de creación del pedido.
  - Banners Contextuales Dinámicos (`OrderTrackingView.tsx`): Mensajes explicativos en cada fase (`En Cola`, `En Cocina`, `Empacado`, `Motorizado en Ruta`, `Entregado`) que comunican con claridad el avance del pedido.

## 7. Flujo de Autenticación y Verificación de Correo (Opción 1 - E-Commerce de Baja Fricción)
* **Acceso Inmediato al Registrarse:**
  - Tras enviar el formulario de registro (`RegisterForm.tsx`), el backend crea la cuenta con `IsEmailVerified = false`, genera un token criptográfico seguro de 64 caracteres con vigencia de 24 horas y encola el correo vía SMTP.
  - El frontend autentica de inmediato al cliente con JWT/refresh token y lo redirige a la tienda (`/la-granjita`) o a la URL previa (`redirectUrl`) sin forzarlo a detenerse en una pantalla de espera obligatoria, maximizando la conversión y evitando el abandono de carritos por demoras en la entrega de correos.
* **Verificación Asíncrona Resiliente (`VerifyEmailView.tsx` y `login/page.tsx`):**
  - Si un usuario no verificado entra a su sesión (`/login`), se le muestra un indicador claro y una alerta contextual con la opción de validar el código o solicitar un nuevo correo de activación con cooldown de 60 segundos.
  - Al pulsar el enlace del correo (`/[slug]/login?tab=verify-email&token=...`) o ingresar manualmente el token, `VerifyEmailView` valida el token mediante `verifyEmailAction`, actualiza `isEmailVerified = true` reactivamente en `useAuthStore` y ofrece un botón de retorno a su cuenta.
* **Diseño del Portal de Acceso (`login/page.tsx`):**
  - Tarjeta centralizada y sobria (`max-w-4xl mx-auto`), sin columnas huérfanas ni botones descontextualizados.
  - Navegación coherente que adapta los enlaces ("Volver a mi cuenta" vs "Volver a Iniciar Sesión") según el estado de autenticación del usuario.

## 8. Autenticación Federada Google OAuth 2.0 y Directorio de Clientes SRI
* **Flujo Seguro OpenID Connect con Google Identity Services (GIS):**
  - El frontend inicializa el SDK oficial (`window.google.accounts.id`) con soporte obligatorio FedCM (`use_fedcm_for_prompt: true`).
  - Utiliza `google.accounts.id.renderButton()` montado sobre contenedor para desplegar la ventana emergente oficial de Google con diseño de píldora que respeta el sistema de diseño de Mesafy.
  - Dispone de un candado `hasInitializedRef` para evitar inicializaciones duplicadas en React StrictMode.
  - Al autenticar, Google entrega un ID Token criptográfico que el cliente despacha al endpoint `POST /api/v1/auth/google`.
* **Validación Backend e Inclusión de Reclamos (`GoogleAuthHandler.cs`):**
  - `GoogleTokenValidator` valida el token contra `https://oauth2.googleapis.com/tokeninfo`, comprobando audiencia (`aud`/`azp`) contra `GOOGLE_CLIENT_ID` y verificando que el correo esté validado por Google (`email_verified = true`).
  - Al validar, el backend marca `user.IsEmailVerified = true` automáticamente, aprovisiona el rol `Customer` y resuelve la sucursal primaria.
  - El JWT generado incluye `tenant_id` y `branch_id` para garantizar el aislamiento Multi-Tenant estricto.
* **Resolución de Colisión de Clave Única en Directorio Fiscal (`Customers`):**
  - Causa Raíz Erradicada: La tabla `Customers` cuenta con un índice único `IX_Customers_TenantId_IdentificationNumber`. Anteriormente, los registros creados sin cédula asignaban el valor estático `"9999999999999"` (Consumidor Final), lo que provocaba colisiones con código PostgreSQL 23505 al registrar un segundo usuario en el mismo tenant.
  - Solución Arquitectónica Definitiva: Tanto `GoogleAuthHandler` como `RegisterHandler` generan identificadores deterministas únicos `$"CF-{user.Id:N}"[..18]`, reservando `"9999999999999"` exclusivamente para la cabecera de facturas anónimas y permitiendo que ilimitados clientes operen en la plataforma sin colisiones.
* **Componente Modular y Desacoplado (< 400 líneas):**
  - `GoogleSignInButton.tsx` (279 líneas) contiene la lógica de conexión con Google Identity Services y manejo de credenciales.
  - Diálogo de pruebas y diagnóstico extraído a `GoogleDevAuthModal.tsx` (159 líneas).
* **Política de Redirección Post-Login de Clientes (`redirectByRole.ts`):**
  - Si un usuario con rol `Customer` inicia sesión o se registra sin parámetro `redirect` explícito, el sistema no fuerza la redirección al home del restaurante (`/la-granjita`), sino que lo mantiene en su portal de cuenta (`/login` o `/[slug]/login`), desplegando de inmediato la vista de bienvenida con sus datos, estado verificado y botones de acción rápida. Si existe un parámetro `redirect` seguro (ej. `/checkout`), se respeta dicha ruta de destino.

## 9. Chatbot WhatsApp Cloud API e IA Conversacional Multi-Tenant (DeepSeek & Google Gemini)
* **Arquitectura Vertical Slice (`Delivery.Features.Chatbot.WhatsAppWebhook`):**
  - Todo el subsistema reside de forma autónoma en una única vertical slice respetando las pruebas de fronteras de arquitectura (VSA).
  - Prohibición estricta de nombres con sufijo `Service`, `Manager` o `Repository`; empleo de `Engine`, `Client`, `Provider` y `Processor`.
* **Aislamiento Multi-Tenant y Multi-Sucursal (`TenantKnowledgeProvider`):**
  - Inyección dinámica en el System Prompt de la identidad del tenant, sucursales físicas (dirección, teléfonos, horarios de atención) y menú categorizado con precios exactos en USD.
  - Resolución inteligente de pedidos: si el usuario menciona un ticket (ej. `#1001` o `pedido 1001`), el provider consulta `AppDbContext.Orders` para informar el estado en tiempo real (`En Cocina`, `En Camino con motorizado`, `Entregado`) junto con el enlace de rastreo satelital.
* **Motor de IA Resiliente (`ResilientChatbotAiEngine`):**
  - Motor Primario: `DeepSeekAiEngine` consumiendo `https://api.deepseek.com/chat/completions` con modelo `deepseek-chat` (alta eficiencia, costo ultra reducido y compatibilidad estándar OpenAI).
  - Motor de Respaldo: `GeminiAiEngine` conmutando de forma automática y transparente a `gemini-2.0-flash` ante cualquier error o saturación de DeepSeek.
* **Persistencia e Idempotencia en Redis 7 (`RedisConversationStore`):**
  - Deduplicación estricta de mensajes Meta (`whatsapp:dedup:{messageId}`) con TTL de 10 minutos para prevenir bucles de procesamiento redundante.
  - Memoria conversacional multi-turno por cliente y tenant (`whatsapp:conv:{tenantId}:{customerPhone}`) con TTL deslizante de 30 minutos y límite de 10 mensajes para optimización de tokens.
* **Despacho y Webhooks (`WhatsAppWebhookEndpoint`):**
  - Handshake GET validando `hub.mode == "subscribe"` y `hub.verify_token == WHATSAPP_VERIFY_TOKEN`.
  - Ingesta POST que responde HTTP 200 inmediatamente a Meta y delega el procesamiento asíncrono en segundo plano (`IWhatsAppWebhookProcessor`) garantizando el cumplimiento de SLAs de entrega.
* **Estrategia de Transición a Producción y Desacoplamiento Total:**
  - Configuración 100% parametrizada vía variables de entorno (`WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_VERIFY_TOKEN`, `DEEPSEEK_API_KEY`, `GEMINI_API_KEY`) e inyectadas al contenedor en `docker-compose.yml`.
  - Fase 1 (Validación Productiva): Se utiliza el número de prueba de Meta (`1349339028273599`) apuntando al dominio oficial de producción (`https://api.mesafy.doicela.dev/api/v1/webhooks/whatsapp`) para verificar Nginx, terminación TLS, base de datos y SignalR sin afectar líneas personales activas.
  - Fase 2 (Número Comercial Físico): Al adquirir el chip/SIM dedicado para el restaurante, el alta se realiza en Meta Business Manager y se actualiza exclusivamente `WHATSAPP_PHONE_NUMBER_ID` en el `.env` del servidor, sin necesidad de recompilaciones ni cambios en el código fuente.

