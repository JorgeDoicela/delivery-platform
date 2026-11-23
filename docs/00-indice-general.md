# Indice Maestro de Documentacion Tecnica — Docs-as-Code

Catalogo maestro y mapa de navegacion de la documentacion tecnica de **Delivery Platform (Mesafy)**. Todos los documentos siguen la taxonomia jerarquica numerica de dos digitos, redaccion tecnica formal, cero emojis y enlaces relativos dinamicos.

---

## 1. Arquitectura y Diseno del Sistema

| Codigo | Documento | Proposito y Alcance Tecnico |
| :--- | :--- | :--- |
| `01-01` | [Vision General de Arquitectura](./01-arquitectura/01-vision-general.md) | Topologia de red, aislamiento Multi-Tenant por TenantId, Vertical Slice Architecture en backend (.NET 8) y Feature-Driven en Next.js 16. |
| `01-02` | [Maquina de Estados de Ordenes](./01-arquitectura/02-maquina-estados.md) | Especificacion formal de estados del ciclo de vida del pedido (Pending, Confirmed, InPreparation, ReadyForDelivery, OutForDelivery, Delivered, Cancelled). |

---

## 2. Backend y Servicios API

| Codigo | Documento | Proposito y Alcance Tecnico |
| :--- | :--- | :--- |
| `02-01` | [Vertical Slices API](./02-backend-servicios/01-vertical-slices-api.md) | Contratos de endpoints REST, handlers desacoplados, DTOs de peticion/respuesta, validadores FluentValidation y codigos de error RFC 7807. |
| `02-02` | [SignalR Hubs en Tiempo Real](./02-backend-servicios/02-signalr-hubs.md) | Especificacion de concentradores WebSocket: `KitchenHub` (grupos de cocina por sucursal) y `TrackingHub` (telemetria GPS por orden). |
| `02-03` | [Autenticacion y Seguridad RBAC](./02-backend-servicios/03-autenticacion-y-seguridad-rbac.md) | Tokens JWT, rotacion criptografica de refresh tokens en cookies HttpOnly, autenticacion biometrica WebAuthn/Passkeys y politicas de roles. |
| `02-04` | [Multitenancy y Personalizacion](./02-backend-servicios/04-multitenancy-y-personalizacion.md) | Pipeline de resolucion de tiendas (`TenantResolutionMiddleware`), filtros globales de consulta en EF Core, dominios propios y motor de plantillas. |
| `02-05` | [Chatbot WhatsApp e Inteligencia Artificial](./02-backend-servicios/05-chatbot-whatsapp-ia-deepseek-gemini.md) | Integracion con WhatsApp Cloud API (Meta), consentimiento RGPD/LOPDP y orquestacion con modelos DeepSeek y Google Gemini. |

---

## 3. Base de Datos y Persistencia

| Codigo | Documento | Proposito y Alcance Tecnico |
| :--- | :--- | :--- |
| `03-01` | [Modelo de Datos y Calculo Espacial PostGIS](./03-base-de-datos/01-modelo-datos-postgis.md) | Diagrama entidad-relacion (31 tablas), tipos geometricos Point y Polygon (SRID 4326), indices espaciales GiST y operadores ST_Contains. |
| `03-02` | [Redis GEO y Cache](./03-base-de-datos/02-redis-geo-cache.md) | Telemetria espacial de conductores con Redis GEO, llaves de idempotencia con TTL y throttling de capacidad de cocina por ventanas de 20 minutos. |
| `03-03` | [Kardex de Inventario y Recetas](./03-base-de-datos/03-kardex-inventario-y-recetas.md) | Explosion automatica de recetas estandar, deduccion de insumos al confirmar comandas y libro mayor inmutable por partida doble. |
| `03-04` | [Semillas y Entornos de Prueba](./03-base-de-datos/04-semillas-y-entornos-de-prueba.md) | Directorio de cuentas semilla, aprovisionamiento multimarca y operacion del switch `RESET_DATABASE_ON_STARTUP` via `DatabaseResetManager`. |

---

## 4. Frontend y Experiencia de Usuario (UI/UX)

| Codigo | Documento | Proposito y Alcance Tecnico |
| :--- | :--- | :--- |
| `04-01` | [Estructura de Route Groups](./04-frontend-web/01-estructura-route-groups.md) | App Router en Next.js 16 con `(storefront)`, `(dashboard)`, `(driver)`, resolucion canonica de rutas en `tenant-routing.ts` y estado Zustand. |
| `04-02` | [Pantalla de Cocina KDS](./04-frontend-web/02-pantalla-cocina-kds.md) | Interfaz Kanban FIFO para cocina, alertas acusticas en bucle con Web Audio API/Howler.js y semaforizacion de urgencia por tiempos. |
| `04-03` | [Pantalla de Repartidor y Telemetria GPS](./04-frontend-web/03-pantalla-repartidor-gps.md) | Transmision continua de geolocalizacion (Capacitor Geolocation / HTML5 Geolocation API), modo de simulacion y deep links a navegadores GPS. |
| `04-04` | [Sistema de Diseno y Temas Dinamicos](./04-frontend-web/04-sistema-de-diseno-y-temas.md) | Paleta fast-food comercial, modo oscuro de alto contraste en KDS, tipografia dual Barlow/Inter y variables CSS inyectadas por tenant. |
| `04-05` | [Flujo de Checkout y Validacion de Cobertura](./04-frontend-web/05-flujo-checkout-y-cobertura.md) | Geocodificacion interactiva con MapLibre GL JS, validacion reactiva con React Hook Form + Zod, metodos de cobro e idempotencia. |
| `04-06` | [Personalizacion de Storefront y Plantillas](./04-frontend-web/06-personalizacion-storefront-y-plantillas.md) | Consola administrativa de marca, editor de diapositivas Hero, banners promocionales y aplicacion de plantillas preconfiguradas. |

---

## 5. Despliegue, Infraestructura y Operaciones

| Codigo | Documento | Proposito y Alcance Tecnico |
| :--- | :--- | :--- |
| `05-01` | [Infraestructura Docker y Compose](./05-despliegue-y-operaciones/01-infraestructura-docker.md) | Manifiesto canonical `docker-compose.yml`, configuracion de contenedores (PostGIS, Redis, Backend, Frontend, Nginx), puertos y healthchecks. |
| `05-02` | [Empaquetado Movil con Capacitor](./05-despliegue-y-operaciones/02-empaquetado-capacitor.md) | Exportacion multiplataforma a aplicacion nativa Android (.apk/.aab) mediante Capacitor 8, politicas de red y permisos de hardware. |
| `05-03` | [Guia DevOps de CI/CD y Rollback](./05-despliegue-y-operaciones/03-guia-despliegue-devops.md) | Pipelines de GitHub Actions (`ci.yml`, `deploy.yml`, `rollback.yml`), matriz de secretos SSH, verificacion de salud y recuperacion automatica. |
| `05-04` | [Puesta en Produccion de Google OAuth y Seguridad](./05-despliegue-y-operaciones/04-puesta-en-produccion-oauth-y-seguridad.md) | Pasos de configuracion en Google Cloud Console, orígenes autorizados, consent screen de verificacion y variables de entorno federadas. |

---

## 6. Roadmap y Requerimientos

| Codigo | Documento | Proposito y Alcance Tecnico |
| :--- | :--- | :--- |
| `06-01` | [Especificacion Funcional y Roadmap](./06-roadmap-y-especificacion/01-especificacion-funcional-y-roadmap.md) | Matriz de requerimientos funcionales y no funcionales, reglas del motor de despacho y matriz de evolucion por fases de entrega. |
