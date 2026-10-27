# 01. Modelo de Datos Relacional y Extension Espacial PostGIS

## 1. Descripcion del Motor de Base de Datos
* **Motor:** PostgreSQL 16
* **Extension:** PostGIS 3.4 (Habilitada via `CREATE EXTENSION IF NOT EXISTS postgis;`)
* **ORM:** Entity Framework Core 8 con `Npgsql.EntityFrameworkCore.PostgreSQL.NetTopologySuite`
* **Sistema de Coordenadas de Referencia (SRID):** `4326` (WGS 84 - Coordenadas geograficas mundiales en grados decimales: Longitud X, Latitud Y).

## 2. Diagrama Entidad-Relacion (ERD)

```mermaid
erDiagram
    BRANCH ||--o{ ORDER : "atiende"
    PRODUCT ||--o{ ORDER_ITEM : "contiene"
    PRODUCT ||--o{ PRODUCT_MODIFIER_GROUP : "configura"
    MODIFIER_GROUP ||--o{ PRODUCT_MODIFIER_GROUP : "agrupa"
    MODIFIER_GROUP ||--o{ MODIFIER_OPTION : "ofrece"
    ORDER ||--o{ ORDER_ITEM : "desglosa"
    ORDER_ITEM ||--o{ ORDER_ITEM_MODIFIER : "personaliza"
    MODIFIER_OPTION ||--o{ ORDER_ITEM_MODIFIER : "referencia"

    BRANCH {
        int Id PK
        string Name
        string Address
        string Phone
        int MaxOrdersPerSlot
        geometry LocationPoint "Point SRID 4326"
        geometry CoveragePolygon "Polygon SRID 4326"
        boolean IsActive
    }

    PRODUCT {
        int Id PK
        string Name
        string Description
        decimal BasePrice
        string ImageUrl
        string Category
        boolean IsActive
    }

    MODIFIER_GROUP {
        int Id PK
        string Name
        int MinSelectable
        int MaxSelectable
        boolean IsRequired
    }

    MODIFIER_OPTION {
        int Id PK
        int ModifierGroupId FK
        string Name
        decimal AdditionalPrice
        boolean IsAvailable
    }

    ORDER {
        uuid Id PK
        int BranchId FK
        string CustomerName
        string CustomerPhone
        string CustomerEmail
        string IdentificationType
        string IdentificationNumber
        string AddressStreet
        string AddressReference
        decimal DeliveryLatitude
        decimal DeliveryLongitude
        decimal Subtotal
        decimal DeliveryFee
        decimal Total
        int Status
        int PaymentMethod
        int DeliveryType
        decimal CashAmountPaid
        decimal ChangeDue
        string TransferReceiptUrl
        timestamptz CreatedAt
        timestamptz UpdatedAt
    }

    ORDER_ITEM {
        uuid Id PK
        uuid OrderId FK
        int ProductId FK
        string ProductNameSnapshot
        decimal UnitPriceSnapshot
        int Quantity
        decimal LineTotal
    }

    ORDER_ITEM_MODIFIER {
        uuid Id PK
        uuid OrderItemId FK
        int ModifierOptionId FK
        string OptionNameSnapshot
        decimal UnitPriceSnapshot
    }
```

## 3. Diccionario de Tablas Principales

### 3.1. Tabla `Branches` (Sucursales y Poligonos de Cobertura)
| Columna | Tipo de Dato | Nulo | Descripcion |
| :--- | :--- | :--- | :--- |
| `Id` | `serial` | NO | Identificador unico entero (PK) |
| `Name` | `varchar(150)` | NO | Nombre operativo de la sucursal |
| `Address` | `varchar(250)` | NO | Direccion fisica del local |
| `Phone` | `varchar(20)` | NO | Telefono de contacto de la sede |
| `MaxOrdersPerSlot` | `int` | NO | Limite de pedidos por ventana de 20 min |
| `LocationPoint` | `geometry(Point, 4326)` | NO | Coordenadas exactas del local |
| `CoveragePolygon` | `geometry(Polygon, 4326)`| NO | Geocerca vectorial de cobertura directa |
| `IsActive` | `boolean` | NO | Estado operativo de la sucursal |

> [!IMPORTANT]
> **Indice Espacial GiST:** Para garantizar resoluciones espaciales en menos de 5ms, la tabla cuenta con el indice GiST:
> ```sql
> CREATE INDEX idx_branches_coverage_polygon ON "Branches" USING GIST ("CoveragePolygon");
> ```

### 3.2. Tabla `Orders` (Encabezado de Pedido)
Almacena el registro inmutable del pedido. Los precios finales, subtotales y costos de envio quedan fijados en esta tabla para proteger la contabilidad ante futuros cambios en el catalogo.

### 3.3. Tablas `OrderItems` y `OrderItemModifiers` (Snapshots Inmutables)
Cada linea de pedido almacena `ProductNameSnapshot` y `OptionNameSnapshot` junto a sus `UnitPriceSnapshot`. Esto garantiza que los historiales de venta y facturacion permanezcan 100% fieles al momento exacto de la compra.
