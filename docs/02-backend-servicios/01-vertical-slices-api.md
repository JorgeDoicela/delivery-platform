# 01. Especificacion de Vertical Slices y APIs Backend

## 1. Descripcion General
El backend de la plataforma esta construido en .NET 8 utilizando C# 12 y Minimal APIs agrupadas bajo el patron Vertical Slice Architecture en `backend/src/Delivery.Features/`.

## 2. Catalogo de Endpoints

### 2.1. Geofencing (Resolucion Espacial de Cobertura)
* **Ruta:** `POST /api/geofencing/resolve`
* **Descripcion:** Evalua si un punto geografico `(latitude, longitude)` esta contenido dentro del poligono de cobertura de alguna sucursal activa.
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

---

### 2.2. Catalogo Activo y Modificadores
* **Ruta:** `GET /api/catalog/menu`
* **Descripcion:** Retorna las categorias, combos y productos activos junto con sus grupos de modificadores jerarquicos (guarniciones obligatorias, ajies y bebidas opcionales).
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
