# 01. Especificacion de Vertical Slices y APIs Backend

## 1. Descripcion General
El backend de la plataforma esta construido en .NET 8 utilizando C# 12 y Minimal APIs agrupadas bajo el patron Vertical Slice Architecture en `backend/src/Delivery.Features/`.

## 2. Catalogo de Endpoints

### 2.0. Autenticacion, Sesiones y RBAC (Modulo Auth)

#### 2.0.1. Inicio de Sesion (`POST /api/v1/auth/login`)
* **Descripcion:** Autentica a un usuario dentro del contexto de un Tenant activo (por subdominio, cabecera o payload). Emite un Access Token (JWT) de 15 minutos y un Refresh Token rotativo de 7 dias almacenado en cookie `HttpOnly` y `Secure`.
* **Seguridad:** Proteccion estricta contra XSS mediante cookies `HttpOnly`, `SameSite=Strict`.
* **Payload de Entrada:**
  ```json
  {
    "email": "esmeralda@lagranjita.com",
    "password": "Admin123!",
    "tenantSlug": "la-granjita"
  }
  ```
* **Respuesta Exitosa (200 OK):**
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "4a7f8b9c...",
    "expiresAt": "2026-10-29T14:45:00Z",
    "user": {
      "id": "e81d4fae-7dec-11d0-a765-00a0c91e6bf6",
      "email": "esmeralda@lagranjita.com",
      "fullName": "Esmeralda - Administradora",
      "phone": "0987654321",
      "tenantId": "c3b9e4a1-0000-0000-0000-000000000001",
      "branchId": null,
      "roles": ["TenantAdmin"]
    }
  }
  ```
* **Cabecera Set-Cookie Emitida:**
  `refreshToken=<token>; Path=/api/v1/auth; HttpOnly; SameSite=Strict; Secure; Max-Age=604800`
* **Errores Posibles:** `400 Bad Request` (validacion), `401 Unauthorized` (`Auth.InvalidCredentials`), `403 Forbidden` (`Auth.UserInactive`, `Auth.TenantInactive`).

#### 2.0.2. Renovacion de Token (`POST /api/v1/auth/refresh`)
* **Descripcion:** Renueva el Access Token validando y rotando atomicamente el Refresh Token (el token anterior se marca como revocado en base de datos para impedir reusos fraudulentos).
* **Entrada:** Extraido automaticamente de la cookie `refreshToken` o recibido en el cuerpo JSON `{"refreshToken": "..."}`.
* **Respuesta Exitosa (200 OK):** Retorna nuevo par `accessToken` y `refreshToken`.

#### 2.0.3. Perfil de Usuario en Sesion (`GET /api/v1/auth/me`)
* **Cabecera Requerida:** `Authorization: Bearer <accessToken>`
* **Descripcion:** Retorna la identidad del usuario autenticado, roles asignados, identificador del Tenant y sucursal fisica asignada.
* **Respuesta Exitosa (200 OK):**
  ```json
  {
    "id": "e81d4fae-7dec-11d0-a765-00a0c91e6bf6",
    "email": "cajero@lagranjita.com",
    "fullName": "Cajero Principal Norte",
    "phone": "0987654323",
    "tenantId": "c3b9e4a1-0000-0000-0000-000000000001",
    "tenantName": "La Granjita Asadero",
    "tenantSlug": "la-granjita",
    "branchId": 1,
    "branchName": "Sucursal #1 (Norte)",
    "roles": ["Cashier"]
  }
  ```

#### 2.0.4. Cierre de Sesion (`POST /api/v1/auth/logout`)
* **Descripcion:** Revoca el Refresh Token en base de datos y borra la cookie `refreshToken` del navegador.
* **Respuesta Exitosa (200 OK):** `{"message": "Sesion cerrada exitosamente."}`

#### 2.0.5. Registro de Cuenta de Cliente (`POST /api/v1/auth/register`)
* **Descripcion:** Permite a un nuevo comensal crear una cuenta en la plataforma vinculada al comercio actual o global. Asigna automáticamente el rol `Customer` (`RoleId = 7`), genera su ficha en el directorio de clientes (`Customers`) para facturación electrónica y despacha de forma inmediata la sesión autenticada con Access Token (JWT) y Refresh Token en cookie `HttpOnly`.
* **Payload de Entrada:**
  ```json
  {
    "fullName": "Juan Perez",
    "email": "juan.perez@gmail.com",
    "phone": "+593991234567",
    "password": "Password123!",
    "tenantSlug": "la-granjita",
    "identificationType": "CONSUMIDOR_FINAL",
    "identificationNumber": "9999999999999"
  }
  ```
* **Respuesta Exitosa (200 OK):**
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "7c1e9a2b...",
    "expiresAt": "2026-11-06T22:30:00Z",
    "user": {
      "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "email": "juan.perez@gmail.com",
      "fullName": "Juan Perez",
      "phone": "+593991234567",
      "role": "Customer",
      "tenantId": "c3b9e4a1-0000-0000-0000-000000000001",
      "tenantSlug": "la-granjita",
      "branchId": null,
      "isActive": true,
      "roles": ["Customer"]
    }
  }
  ```
* **Cabecera Set-Cookie Emitida:**
  `refreshToken=<token>; Path=/api/v1/auth; HttpOnly; SameSite=Lax; Secure; Max-Age=604800`
* **Errores Posibles:** `400 Bad Request` (fallo de validación en contraseña o teléfono), `409 Conflict` (`Auth.EmailAlreadyRegistered` si el correo ya existe).

#### 2.0.6. Autenticacion Federada con Google (`POST /api/v1/auth/google`)
* **Descripcion:** Autentica e inicia sesión utilizando Google Identity Services (OpenID Connect). El backend valida criptográficamente el token con el endpoint de verificación oficial de Google (`https://oauth2.googleapis.com/tokeninfo`). Si el usuario no existe, aprovisiona de forma instantánea (Just-In-Time) la cuenta del cliente y emite los tokens JWT y cookies correspondientes.
* **Payload de Entrada:**
  ```json
  {
    "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...",
    "tenantSlug": "la-granjita"
  }
  ```
* **Respuesta Exitosa (200 OK):**
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "8b2d4e1a...",
    "expiresAt": "2026-11-06T22:30:00Z",
    "user": {
      "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "email": "usuario.google@gmail.com",
      "fullName": "Usuario Google",
      "phone": "",
      "role": "Customer",
      "tenantId": "c3b9e4a1-0000-0000-0000-000000000001",
      "tenantSlug": "la-granjita",
      "branchId": null,
      "isActive": true,
      "roles": ["Customer"],
      "picture": "https://lh3.googleusercontent.com/..."
    }
  }
  ```
* **Errores Posibles:** `400 Bad Request` (`Auth.GoogleEmailNotVerified`), `401 Unauthorized` (`Auth.InvalidGoogleToken`), `403 Forbidden` (`Auth.TenantInactive`, `Auth.UserInactive`).

---

### 2.1. Sucursales, Geofencing y Capacidad de Horno

#### 2.1.1. Resolucion Espacial de Cobertura (`POST /api/geofencing/resolve`)
* **Descripcion:** Evalua si un punto geografico `(latitude, longitude)` esta contenido dentro del poligono de cobertura de alguna sucursal activa mediante PostGIS NetTopologySuite.
* **Payload de Entrada:**
  ```json
  {
    "latitude": -0.1782,
    "longitude": -78.4845
  }
  ```
* **Respuesta Exitosa (200 OK):**
  ```json
  {
    "branchId": 1,
    "branchName": "Sucursal 1 - Norte",
    "address": "Av. Amazonas y Gaspar de Villarroel",
    "phone": "0987654321",
    "maxOrdersPerSlot": 12,
    "isActive": true
  }
  ```
* **Respuesta Fuera de Cobertura (422 Unprocessable Entity):**
  ```json
  {
    "code": "Geofencing.OutOfCoverage",
    "message": "La ubicacion seleccionada no cuenta con cobertura de entrega directa para ninguna sucursal."
  }
  ```

#### 2.1.2. Listado de Sucursales Operativas (`GET /api/branches`)
* **Descripcion:** Obtiene el listado de sucursales activas del tenant resuelto con direccion, telefono, capacidad maxima por slot y coordenadas WGS 84.
* **Respuesta Exitosa (200 OK):**
  ```json
  [
    {
      "id": 1,
      "name": "Sucursal 1 - Norte",
      "address": "Av. Amazonas y Gaspar de Villarroel",
      "phone": "0987654321",
      "maxOrdersPerSlot": 12,
      "isActive": true,
      "latitude": -0.1782,
      "longitude": -78.4845
    }
  ]
  ```

#### 2.1.3. Consulta de Capacidad Operativa por Slot (`GET /api/branches/{branchId}/capacity`)
* **Descripcion:** Retorna la carga de ordenes en la ventana actual de 20 minutos (`currentOrdersInSlot`), capacidad maxima configurada y tiempo de entrega estimado dinamicamente.
* **Respuesta Exitosa (200 OK):**
  ```json
  {
    "branchId": 1,
    "currentOrdersInSlot": 4,
    "maxOrdersPerSlot": 12,
    "isSlotAvailable": true,
    "estimatedDeliveryMinutes": 35
  }
  ```

#### 2.1.4. Modificacion de Horarios y Disponibilidad Operativa (`PUT /api/branches/{id}/schedule`)
* **Autorizacion Requerida:** Politica `BranchStaffOnly` (`TenantAdmin`, `BranchManager`, `SuperAdmin`).
* **Descripcion:** Actualiza la hora de apertura, hora de cierre (en formato militar 24h `HH:mm`) y el estado operativo activo/pausa de una sucursal del establecimiento autenticado.
* **Cuerpo de Solicitud (Payload):**
  ```json
  {
    "openingTime": "10:30",
    "closingTime": "21:30",
    "isActive": true
  }
  ```
* **Respuesta Exitosa (200 OK):**
  ```json
  {
    "branchId": 1,
    "name": "Guamaní",
    "openingTime": "10:30",
    "closingTime": "21:30",
    "isActive": true
  }
  ```
* **Errores Controlados:** `400 Bad Request` ante formato no válido o si `openingTime == closingTime`, `404 Not Found` si la sucursal no pertenece al tenant activo.

---

#### 2.2.1. Catalogo Activo y Modificadores (`GET /api/catalog/menu`)
* **Parametros de Consulta Opcionales:** `?includeInactive=true` (usado por `/admin/inventario` para listar e interactuar con productos tanto activos como agotados; en la vitrina publica se omite o envia `false`).
* **Descripcion:** Retorna las categorias, combos y productos activos (o la totalidad del catalogo maestro si `includeInactive=true`) junto con sus grupos de modificadores jerarquicos (guarniciones obligatorias, ajies y bebidas opcionales).
* **Respuesta Exitosa (200 OK):**
  ```json
  {
    "categories": [
      {
        "categoryName": "Combos de Pollo Asado",
        "products": [
          {
            "id": 1,
            "name": "Combo 1: 1/4 de Pollo",
            "description": "1/4 de pollo asado al carbon + 1 guarnicion a eleccion + aji de la casa",
            "basePrice": 4.50,
            "imageUrl": "https://images.unsplash.com/photo-1598103442097-8b74394b95c6",
            "category": "Combos de Pollo Asado",
            "isActive": true,
            "modifierGroups": [
              {
                "id": 1,
                "name": "Selecciona tu Guarnicion",
                "minSelectable": 1,
                "maxSelectable": 1,
                "isRequired": true,
                "options": [
                  { "id": 1, "name": "Papas Fritas Tradicionales", "additionalPrice": 0.0, "isAvailable": true },
                  { "id": 2, "name": "Arroz con Menestra de Lenteja", "additionalPrice": 0.0, "isAvailable": true }
                ]
              }
            ]
          }
        ]
      }
    ],
    "totalProducts": 5
  }
  ```

#### 2.2.2. Platos Populares y Mas Vendidos (`GET /api/catalog/popular`)
* **Parametros de Consulta Opcionales:**
  * `limit`: Cantidad maxima de productos a retornar (por defecto 8, maximo 50).
  * `days`: Ventana movil de historial de ventas en dias (por defecto 30 dias).
* **Cabecera Multitenant:** `X-Tenant-Slug: <slug>` (permite consumo publico no autenticado desde vitrinas `/[slug]`).
* **Mecanismo de Agregacion y Resiliencia:**
  1. **Cache Redis (TTL 30 min):** Consulta `catalog:popular:{tenantId}:{limit}:{days}` para descarga de base de datos.
  2. **Agregacion SQL en PostgreSQL:** Suma de `OrderItems.Quantity` en ordenes no canceladas dentro de la ventana de dias.
  3. **Arranque en Frio (Cold-Start):** Si el volumen de ventas historicas del establecimiento no alcanza el `limit`, se completa de forma transparente con los productos insignes activos ordenados por prioridad de categoria y precio, garantizando que la vitrina nunca muestre secciones vacias.
* **Respuesta Exitosa (200 OK):** Array de `MenuProductDto` con campo `totalSold`.

#### 2.2.3. Alternar Disponibilidad de Producto (`PUT /api/catalog/products/{id}/status`)
* **Descripcion:** Habilita o deshabilita operativamente un producto para suspender temporalmente su venta en cocina o vitrina.
* **Payload de Entrada:**
  ```json
  {
    "productId": 1,
    "isActive": false
  }
  ```
* **Respuesta Exitosa (200 OK):**
  ```json
  {
    "productId": 1,
    "isActive": false,
    "message": "Estado de disponibilidad actualizado correctamente."
  }
  ```

#### 2.2.4. Creacion y Edicion de Producto con Imagen Propia (`POST /api/catalog/products` y `PUT /api/catalog/products/{id}`)
* **Descripcion:** Registra un nuevo producto o actualiza nombre, descripcion, categoria, precio base e imagen personalizada (`imageUrl`) dentro del catalogo aislado del establecimiento activo.
* **Payload de Entrada:** `{"name": "Parrillada Especial", "description": "Cortes selectos...", "basePrice": 24.50, "category": "Parrilladas", "imageUrl": "https://.../plato.webp", "isActive": true}`
* **Respuesta Exitosa (200 OK):** Retorna `UpsertProductResponse`.

---

### 2.3. Creacion de Ordenes (Checkout con Idempotencia)
* **Ruta:** `POST /api/orders`
* **Cabecera Requerida:** `Idempotency-Key: <UUIDv4>`
* **Descripcion:** Recalcula y blinda los precios unitarios en backend contra la base de datos (descartando cualquier precio manipulado en cliente), calcula el cambio en efectivo y registra la transaccion de forma atomica.
* **Payload de Entrada:**
  ```json
  {
    "branchId": 1,
    "customerName": "Juan Perez",
    "customerPhone": "0991234567",
    "customerEmail": "juan@ejemplo.com",
    "identificationType": "CEDULA",
    "identificationNumber": "1712345678",
    "addressStreet": "Av. America N34-21",
    "addressReference": "Frente al parque, casa blanca de dos pisos",
    "deliveryLatitude": -0.1782,
    "deliveryLongitude": -78.4845,
    "paymentMethod": 1,
    "deliveryType": 1,
    "cashAmountPaid": 20.00,
    "items": [
      {
        "productId": 1,
        "quantity": 2,
        "selectedModifierOptionIds": [1, 5]
      }
    ]
  }
  ```
* **Respuesta Exitosa (201 Created):**
  ```json
  {
    "orderId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "status": 3,
    "total": 9.00,
    "changeDue": 11.00,
    "branchName": "Sucursal 1 - Norte",
    "createdAt": "2026-10-27T15:30:00Z"
  }
  ```

---

### 2.4. Consulta de Orden por ID
* **Ruta:** `GET /api/orders/{orderId}`
* **Descripcion:** Retorna el detalle exhaustivo del pedido, snapshots de precios inmutables al momento de la compra y desglose de liquidacion.

---

### 2.5. Actualizacion de Estado de Orden
* **Ruta:** `PATCH /api/orders/{orderId}/status`
* **Payload de Entrada:**
  ```json
  {
    "status": 4
  }
  ```
* **Respuesta Exitosa (204 No Content)**

---

### 2.5.1. Aprobacion o Rechazo de Transferencia Bancaria
* **Ruta:** `POST /api/orders/{id}/transfer-approval`
* **Descripcion:** Utilizado por cajeros o supervisores para validar el comprobante de transferencia bancaria de pedidos en estado `PendingPaymentValidation`. Si se aprueba, la orden pasa a `Confirmed` y se emite la alerta a cocina vía SignalR; si se rechaza, pasa a `Cancelled`.
* **Payload de Entrada:**
  ```json
  {
    "orderId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "isApproved": true,
    "rejectionReason": null
  }
  ```
* **Respuesta Exitosa (200 OK):**
  ```json
  {
    "orderId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "newStatus": 3,
    "message": "Comprobante validado exitosamente. Orden enviada a cocina."
  }
  ```

---

### 2.6. Comandas de Cocina (KDS)
* **Ruta:** `GET /api/kitchen/branches/{branchId}/orders`
* **Descripcion:** Retorna todas las ordenes en estados activos de cocina (`Confirmed`, `InKitchen`, `ReadyForDelivery`) ordenadas estrictamente bajo criterio FIFO (`CreatedAt ASC`).

---

### 2.7. Telemetria del Repartidor (GPS a Redis)
* **Ruta:** `POST /api/tracking/driver-location`
* **Payload de Entrada:**
  ```json
  {
    "orderId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "latitude": -0.1782,
    "longitude": -78.4845,
    "heading": 92.5
  }
  ```
* **Respuesta Exitosa (200 OK)**

* **Ruta:** `GET /api/tracking/orders/{orderId}/driver-location`
* **Descripcion:** Consulta en Redis GEO las coordenadas mas recientes del repartidor para dicha orden.

---

### 2.8. Modulo Multitenant y Personalizacion de Plataforma (Tenants)

#### 2.8.1. Directorio Publico de Comercios (`GET /api/tenants`)
* **Descripcion:** Retorna el directorio de negocios activos en la plataforma para navegacion publica o seleccion de marca.
* **Respuesta Exitosa (200 OK):**
  ```json
  {
    "tenants": [
      {
        "id": "c3b9e4a1-0000-0000-0000-000000000001",
        "slug": "la-granjita",
        "name": "La Granjita Asadero",
        "tagline": "El mejor pollo al carbon",
        "logoUrl": "https://.../logo.png",
        "brandPrimaryColor": "#E4002B",
        "branchesCount": 2
      }
    ]
  }
  ```

#### 2.8.2. Configuracion del Tenant Activo (`GET /api/tenants/current`)
* **Descripcion:** Retorna la identidad de marca, plantilla visual de landing page, tarifas de delivery, metodos de pago y sucursales del tenant resuelto por subdominio o cabecera `X-Tenant-Slug`.
* **Respuesta Exitosa (200 OK):**
  ```json
  {
    "tenantId": "c3b9e4a1-0000-0000-0000-000000000001",
    "slug": "la-granjita",
    "name": "La Granjita Asadero",
    "tagline": "El mejor pollo al carbon",
    "description": "Tradicion en carnes y pollos a la brasa desde 1998.",
    "heroSubtitle": "Personaliza tu orden con guarniciones calientes y aji artesanal",
    "logoUrl": "https://.../logo.png",
    "brandPrimaryColor": "#E4002B",
    "brandPrimaryHoverColor": "#C40024",
    "brandAccentColor": "#F59E0B",
    "contactPhone": "0987654321",
    "contactEmail": "contacto@lagranjita.com",
    "landingLayoutTemplate": "asadero-clasico",
    "customDomain": "pedidos.lagranjita.com",
    "baseDeliveryFee": 1.50,
    "enableDelivery": true,
    "enableTakeout": true,
    "enableDineIn": false,
    "acceptsCash": true,
    "acceptsBankTransfer": true,
    "acceptsCard": false,
    "bankInfo": {
      "bankName": "Banco Pichincha",
      "accountType": "Corriente",
      "accountNumber": "2100123456",
      "accountHolder": "La Granjita S.A.S.",
      "taxId": "1792345678001"
    },
    "heroSlides": [],
    "promotionalBanners": [],
    "termsAndConditionsMarkdown": "...",
    "privacyPolicyMarkdown": "...",
    "branches": []
  }
  ```

#### 2.8.3. Aprovisionamiento de Nuevo Tenant (`POST /api/tenants`)
* **Autorizacion:** Rol `SuperAdmin`
* **Descripcion:** Aprovisiona un nuevo comercio en la base de datos, configurando sucursal matriz, catalogo base predeterminado y usuario inicial `TenantAdmin`.
* **Payload de Entrada:**
  ```json
  {
    "name": "Pollos El Brasero",
    "slug": "el-brasero",
    "businessName": "El Brasero Alimentos Cia. Ltda.",
    "taxId": "1791234567001",
    "adminEmail": "admin@elbrasero.com",
    "adminPassword": "Password123!",
    "adminFullName": "Administrador Brasero",
    "matrixBranchName": "Sucursal Matriz Centro",
    "matrixBranchAddress": "Av. 10 de Agosto y Colon",
    "brandPrimaryColor": "#D97706",
    "customDomain": "pedidos.elbrasero.com"
  }
  ```
* **Respuesta Exitosa (200 OK):** Retorna `CreatedTenantDto` con identificadores generados.

#### 2.8.4. Directorio de Plataforma para SuperAdmin (`GET /api/tenants/platform`)
* **Autorizacion:** Rol `SuperAdmin`
* **Descripcion:** Lista exhaustiva de todos los comercios registrados (activos e inactivos) con metricas agregadas de sucursales, usuarios y volumen operacional.

#### 2.8.5. Activar o Suspender Comercio (`PATCH /api/tenants/{tenantId}/status`)
* **Autorizacion:** Rol `SuperAdmin`
* **Descripcion:** Cambia el estado de actividad de un comercio. Al desactivarse, se impide el acceso a sus canales de venta y dashboards.
* **Payload de Entrada:** `{"isActive": false}`

#### 2.8.6. Actualizar Storefront y Politicas (`PUT /api/tenants/current/storefront`)
* **Autorizacion:** Roles `TenantAdmin`, `SuperAdmin`
* **Descripcion:** Actualiza la identidad visual (colores, logo, textos), dominio personalizado (`CustomDomain`), plantilla de landing page, banners, tarifas, datos bancarios y textos legales en Markdown del comercio activo.

---

### 2.9. Modulo de Repartidores y Gestion de Despacho (Drivers)

#### 2.9.1. Perfil Operativo del Repartidor (`GET /api/driver/me`)
* **Autorizacion:** Roles `Driver`, `SuperAdmin`
* **Descripcion:** Retorna los datos de identidad del repartidor autenticado, vehículo registrado, placa, disponibilidad actual (`isAvailable`), sucursal vinculada y métricas acumuladas del turno actual (pedidos entregados hoy y efectivo en mano a liquidar).

#### 2.9.2. Actualizar Disponibilidad y Vehículo (`PUT /api/driver/status`)
* **Autorizacion:** Roles `Driver`, `SuperAdmin`
* **Descripcion:** Permite al repartidor conmutar su estado entre disponible para despacho (`isAvailable: true`) o en pausa (`isAvailable: false`), además de actualizar datos del vehículo o placa.
* **Payload de Entrada:**
  ```json
  {
    "isAvailable": true,
    "vehicleType": "Motocicleta",
    "licensePlate": "PBA-1234"
  }
  ```

#### 2.9.3. Bandejas de Órdenes del Repartidor (`GET /api/driver/orders`)
* **Autorizacion:** Roles `Driver`, `SuperAdmin`
* **Parametros Query:** `branchId` (opcional, `int`)
* **Descripcion:** Obtiene las comandas segmentadas en tres colecciones operativas:
  - `activeOrders`: Pedidos en ruta (`OnTheWay`) asignados al repartidor.
  - `availableOrders`: Pedidos listos en cocina (`ReadyForDelivery`) esperando toma por motorizados.
  - `deliveredToday`: Pedidos completados (`Delivered`) en la jornada actual.
  - `shiftSummary`: Resumen cuantitativo del turno (conteo de entregas, efectivo total a liquidar en caja y ganancias estimadas).

#### 2.9.4. Reclamar / Asignarse Pedido de Cocina (`POST /api/driver/orders/{orderId}/claim`)
* **Autorizacion:** Roles `Driver`, `SuperAdmin`
* **Descripcion:** Asigna una comanda lista en cocina al repartidor solicitante. Transiciona la orden de `ReadyForDelivery` a `OnTheWay`, vincula el registro `OrderDelivery` y notifica en tiempo real a los hubs de SignalR (`TrackingHub` y `KitchenHub`).
* **Respuesta Exitosa (200 OK):** Retorna `DriverOrderDto` de la comanda tomada.

---

## Navegacion de Documentacion
* **Anterior:** [02. Maquina de Estados del Pedido](../01-arquitectura/02-maquina-estados.md)
* **Siguiente:** [02. Especificacion de SignalR Hubs en Tiempo Real](./02-signalr-hubs.md)
* **Indice General:** [README Principal](../../README.md)
