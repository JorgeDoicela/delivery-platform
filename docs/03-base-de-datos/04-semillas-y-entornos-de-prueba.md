# 04. Semillas y Datos de Prueba para Entornos

## 1. Descripcion General del Sistema de Semillas

El backend de la plataforma incorpora un mecanismo de inicializacion y siembra automatica de datos (*Database Seeding*) desacoplado en clases parciales dentro de `backend/src/Delivery.Core/Infrastructure/Persistence/`:
* `DatabaseSeeder.cs`: Inicializacion de extensiones PostGIS, roles del sistema, superadministrador global y tenant principal.
* `DatabaseSeeder.Catalog.cs`: Siembra de sucursales con poligonos geofence reales en Quito, categorias, catalogo de platos, modificadores, recetas estandar e inventario base con kardex.
* `DatabaseSeeder.SecondaryTenants.cs`: Siembra de franquicias secundarias para validar multitenancy estricto, temas visuales y plantillas diferenciadas.

---

## 2. Flujo de Inicializacion en Arranque

```mermaid
flowchart TD
    AppStart[Arranque de Delivery.Api Program.cs] --> CheckEnv{Es Entorno Development?}
    CheckEnv -- Si --> RunMigrations[context.Database.MigrateAsync]
    RunMigrations --> SeedAsync[DatabaseSeeder.SeedAsync]
    SeedAsync --> SeedRoles[1. Sembrar Roles Globales 1 a 7]
    SeedRoles --> SeedSuperAdmin[2. Sembrar SuperAdmin jorge@admin.com]
    SeedSuperAdmin --> SeedGranjita[3. Sembrar Tenant La Granjita Asadero]
    SeedGranjita --> SeedBranches[3.1. Sucursales Norte y Sur con Poligonos GiST]
    SeedBranches --> SeedInventory[3.2. Proveedores, Insumos Crudos y Kardex Inicial]
    SeedBranches --> SeedCatalog[3.3. Categorias, Platos, Modificadores y Recetas]
    SeedGranjita --> SeedSecondary[4. Sembrar Tenants Secundarios: Brasas del Valle]
    SeedSecondary --> Ready[Base de Datos Lista para Pruebas Locales]
    CheckEnv -- No (Produccion) --> Standby[Migraciones aplicadas mediante scripts CI/CD]
```

---

## 3. Directorio de Cuentas y Credenciales de Prueba

En entornos de desarrollo local, las cuentas sembradas obtienen su contraseña a partir de la variable de entorno `INITIAL_ADMIN_PASSWORD` definida en el archivo `.env` raíz (con fallback a `Admin123!` para suites de pruebas unitarias automatizadas):

| Rol del Sistema | Correo Electronico | Contrasena (.env) | Tenant Asignado | Sucursal Asignada | Proposito de Prueba |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SuperAdmin** | `jorge@admin.com` | `${INITIAL_ADMIN_PASSWORD}` | Global (`null`) | Global (`null`) | Gestion de franquicias en `/superadmin` |
| **TenantAdmin** | `esmeralda@lagranjita.com` | `${INITIAL_ADMIN_PASSWORD}` | `la-granjita` | Todas las sedes | Administracion de carta, banners y politicas |
| **BranchManager**| `gerente.norte@lagranjita.com`| `${INITIAL_ADMIN_PASSWORD}` | `la-granjita` | `1` (Sucursal Norte) | Control de capacidad y turnos de sede norte |
| **Cashier** | `cajero.norte@lagranjita.com` | `${INITIAL_ADMIN_PASSWORD}` | `la-granjita` | `1` (Sucursal Norte) | Apertura/cierre de turnos y aprobacion de transferencias |
| **KitchenStaff** | `cocina.norte@lagranjita.com` | `${INITIAL_ADMIN_PASSWORD}` | `la-granjita` | `1` (Sucursal Norte) | Terminal KDS en `/cocina` con alertas de audio |
| **Driver** | `repartidor@lagranjita.com` | `${INITIAL_ADMIN_PASSWORD}` | `la-granjita` | `1` (Sucursal Norte) | Transmision GPS en `/repartidor` y `/active-delivery` |
| **TenantAdmin (T2)**| `admin@brasasdelvalle.com`| `${INITIAL_ADMIN_PASSWORD}` | `brasas-del-valle`| Matriz Cumbaya | Validacion de aislamiento multitenant y tema verde |

---

## 4. Directorio de Tenants y Plantillas Sembradas

### 4.1. Tenant Principal: La Granjita Asadero (`la-granjita`)
* **Propuesta Gastronomica:** Asadero tradicional de pollos a la brasa y carnes al carbon en Quito.
* **Plantilla Visual:** `asadero-clasico`
* **Colores de Marca:** Primario `#E4002B` (rojo vivo), Hover `#C40024`, Acento `#F59E0B` (ambar calido).
* **Sucursal Activa:**
  1. `Guamaní` (Establecimiento SRI 001): Ubicada en Clodoveo Carrión, Sector Guamaní (Quito Sur) (`-0.332280, -78.557082`). Polígono GiST cubriendo el sur de Quito (Guamaní, Nueva Aurora, Ciudad Quitumbe). Capacidad de hornos configurada a 15 órdenes por ventana de 20 minutos.

### 4.2. Tenant Secundario: Brasas del Valle (`brasas-del-valle`)
* **Propuesta Gastronomica:** Parrilla argentina gourmet y cortes Angus madurados.
* **Plantilla Visual:** `steakhouse-gourmet`
* **Colores de Marca:** Primario `#047857` (verde esmeralda oscuro), Hover `#065F46`, Acento `#D97706`.
* **Sucursal Activa:** `Matriz Cumbaya` (`-0.2014, -78.4312`). Poligono GiST cubriendo el Valle de Cumbaya y Tumbaco.

---

## 5. Script de Base de Datos Base (`scripts/db/init-postgis.sql`)

El contenedor Docker `delivery-postgres` ejecuta automaticamente al inicializarse el script montado en `/docker-entrypoint-initdb.d/01-init-postgis.sql`:

```sql
-- Habilitacion obligatoria de la extension PostGIS para calculo espacial
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verificacion de version PostGIS instalada
DO $$
BEGIN
    RAISE NOTICE 'PostGIS Extension initialized successfully: %', postgis_full_version();
END $$;
```

---

## 6. Motor de Corpus Gastronomico y Validacion (`scripts/db/seed-corpus.ps1`)

Los catalogos oficiales residen en archivos JSON estructurados dentro de `backend/src/Delivery.Core/Infrastructure/Persistence/Corpus/`:
* `catalog.la-granjita.json`: Menu real extraido del sistema comercial de La Granjita (6 categorias comerciales: `Combos`, `Pollos y Medios`, `Personales`, `Porciones`, `Extras`, `Bebidas`; 3 grupos de modificadores: `Elección de Guarnición`, `Tipo de Ají`, `Bebidas Opcionales`; 49 productos comerciales con SKU limpio, precios reales, fotos de alta resolucion y 40 recetas ligadas al despiece en octavos de pollo crudo y consumibles).
* `catalog.brasas-del-valle.json`: Menu de cortes de carne y parrilladas gourmet para Brasas del Valle.

### 6.1. Estrategia de Carga Resiliente (`CorpusCatalogLoader.cs`)
1. **Lectura Directa en Disco:** Busca el archivo en rutas relativas del proyecto para reflejar adiciones inmediatas de items en entornos locales de desarrollo.
2. **Fallback a Recurso Embebido:** Si los archivos no estan presentes como archivos sueltos en el contenedor (como en entornos de produccion o pruebas unitarias aisladas), los lee directamente desde el ensamblado compilado `Delivery.Core.dll` mediante `GetManifestResourceStream`.

### 6.2. Script Operativo de Validacion de Corpus
Para verificar la integridad de los JSON y la idempotencia de siembra:
```powershell
# Validar unicamente sintaxis JSON, SKUs y precios no negativos
.\scripts\db\seed-corpus.ps1 -ValidateOnly

# Validar y ejecutar la suite completa de pruebas de siembra e idempotencia en .NET
.\scripts\db\seed-corpus.ps1
```

---

## 7. Procedimiento de Reinicio Limpio de Datos en Desarrollo

Para restablecer la base de datos a su estado virgen con semillas frescas:

```powershell
# 1. Detener y destruir volumenes de datos
docker compose down -v

# 2. Levantar la infraestructura limpia
pnpm infra:up

# 3. Iniciar el backend para aplicar migraciones y semillas automaticamente
pnpm dev:backend
```

---

## Navegacion de Documentacion
* **Anterior:** [03. Explosion de Recetas y Kardex de Inventario](./03-kardex-inventario-y-recetas.md)
* **Siguiente:** [01. Estructura de Rutas y Route Groups en Frontend](../04-frontend-web/01-estructura-route-groups.md)
* **Indice General:** [README Principal](../../README.md)

