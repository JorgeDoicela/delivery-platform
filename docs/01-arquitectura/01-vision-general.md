# 01. Vision General de la Arquitectura

## 1. Proposito del Sistema
La plataforma de delivery directo es una solucion integral orientada a eliminar la intermediacion de terceros en pedidos de comida preparada, proporcionando canales directos de venta, despacho en cocina, gestion de repartidores y facturacion para 2 sucursales operativas en Quito, Ecuador.

## 2. Diagrama de Topologia General

```mermaid
flowchart TB
    subgraph Clientes["Canales de Usuario"]
        WebStore["Storefront Web / PWA (Next.js 16)"]
        KDS["Kitchen Display System (KDS Cocina)"]
        DriverApp["App Repartidor (Capacitor / Mobile Web)"]
    end

    subgraph BackendGateway["Capa de Aplicacion (.NET 8)"]
        Api["Delivery.Api (Minimal APIs / Controllers)"]
        Features["Delivery.Features (Vertical Slice Architecture)"]
        Core["Delivery.Core (Dominio, Entidades, Enums, Contratos)"]
        Hubs["SignalR Hubs (KitchenHub, TrackingHub)"]
        Worker["Hangfire Server (Workers Asincronos)"]
    end

    subgraph Persistencia["Capa de Datos y Cache"]
        Postgres[(PostgreSQL 16 + PostGIS 3.4)]
        Redis[(Redis 7: GEO, Cache e Idempotencia)]
    end

    WebStore -->|HTTP / JSON| Api
    KDS -->|HTTP / JSON + WebSockets| Hubs
    DriverApp -->|HTTP / Telemetria GPS| Api
    Api --> Features
    Features --> Core
    Features -->|Consultas Espaciales GiST| Postgres
    Features -->|Redis GEO / Keys con TTL| Redis
    Hubs -->|Notificaciones Push en Vivo| KDS
    Hubs -->|Tracking Satelital en Tiempo Real| WebStore
    Features -->|Encolado de Tareas| Worker
```

## 3. Patrones Arquitectonicos Implementados

### 3.1. Vertical Slice Architecture en Backend
En lugar de capas horizontales tradicionales (N-Tier o Clean clasica), el backend organiza el codigo por caracteristicas funcionales autocontenidas (*Vertical Slices*). Cada caracteristica agrupa su comando/consulta, validador FluentValidation, manejador y DTOs:
* `Delivery.Features/Geofencing`: Resolucion espacial de cobertura por coordenadas.
* `Delivery.Features/Catalog`: Catalogo activo con grupos de modificadores jerarquicos.
* `Delivery.Features/Orders`: Creacion de orden con blindaje de subtotal en backend y maquina de estados.
* `Delivery.Features/Kitchen`: Obtencion de comandas activas en orden FIFO para cocina.
* `Delivery.Features/Tracking`: Ingesta de geolocalizacion del repartidor en Redis GEO.

### 3.2. Feature-Driven Architecture en Frontend
El frontend Next.js 16 con App Router organiza los componentes y la logica por dominios funcionales en `src/features/`:
* `cart`: Estado global persistido con Zustand para el carrito de compras.
* `catalog`: Consultas con TanStack Query y modal de seleccion de modificadores.
* `checkout`: Resolucion de cobertura, formulario reactivo con React Hook Form + Zod, idempotencia.
* `kitchen`: Gestion de comandas con SignalR y alertas sonoras nativas con Web Audio API.
* `tracking`: Enlace de telemetria satelital y simulacion de recorrido para pruebas.

### 3.3. Manejo de Concurrencia e Idempotencia
* **Idempotency-Key en Cabecera HTTP:** Todo checkout genera un UUIDv4 enviado en la cabecera `Idempotency-Key`. El middleware en backend almacena el resultado en Redis con TTL de 24 horas (`idempotency:{key}`), bloqueando transacciones duplicadas por doble clic o interrupciones de red.
* **Control de Capacidad en Horno (Throttling):** Restriccion configurable `max_orders_per_slot` por intervalo de 20 minutos para prevenir saturacion de cocina.
