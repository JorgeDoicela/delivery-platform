# Directrices del Proyecto Delivery Platform (AGENTS.md)

Este documento define las reglas de ingeniería de software, arquitectura técnica, puertos asignados y estándares de calidad profesional obligatorios para cualquier agente o desarrollador que opere en este repositorio.

---

## 1. Identidad del Proyecto y Stack Tecnológico

Plataforma integral de pedidos y delivery en tiempo real para asaderos de pollos y carnes a la brasa, diseñada con un frontend unificado y un backend monolítico modular de alto rendimiento.

* **Backend:** .NET 8 (C# 12) Web API con Vertical Slice Architecture (VSA).
* **Persistencia:** PostgreSQL 16 + PostGIS (NetTopologySuite) para geocercas poligonales indexadas.
* **Caché y Concurrencia:** Redis 7 (con throttling de capacidad de horno por ranuras de 20 minutos).
* **Tiempo Real:** ASP.NET Core SignalR con grupos por sucursal (`kitchen_branch_{branchId}`) y por orden (`order_tracking_{orderId}`).
* **Frontend:** Next.js (App Router) con React 19, TypeScript estricto y Tailwind CSS.
* **Mapas:** MapLibre GL JS (renderizado vectorial WebGL sin coste por petición).
* **Audio Operativo:** Howler.js (reproducción en bucle en terminales de cocina KDS).
* **Gestión de Estado:** Zustand con persistencia en LocalStorage.
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
| **Backend, APIs y Base de Datos** | `delivery-backend` | `desarrollo-backend` | VSA, queries PostGIS, throttling Redis, SignalR y middlewares. |
| **Frontend, Rutas y Componentes** | `delivery-frontend` | `desarrollo-frontend` | App Router, Feature-Driven design, Zustand, SignalR y MapLibre. |
| **Diseño Visual, UI/UX y Estilos** | `delivery-estilos` | `desarrollo-frontend` | Tokens de color (carbón/ámbar), tipografía, ergonomía táctil y WCAG. |
| **Documentación y Dosieres** | N/A | `documentacion` | Taxonomía numérica, especificaciones técnicas y diagramas Mermaid. |
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
