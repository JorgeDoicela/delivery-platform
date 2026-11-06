---
name: delivery-estilos
description: Sistema de diseño, UI/UX comercial y operativa, y guía de estilos multi-tenant para Delivery Platform (Modo claro comercial en Storefront y Landing de Plataforma, modo oscuro antirreflejo en KDS, tipografía dual Barlow/Inter, scrollbars flotantes sin flechas, cero emojis y ergonomía táctil).
---
# Sistema de Diseño y Guía de Estilos Oficial (Delivery Platform)

Esta habilidad define los **principios visuales universales, tokens de diseño, patrones de componentes reutilizables y estándares de accesibilidad** para todas las vistas de **Delivery Platform**, tanto para la **Landing Principal de la Plataforma (`/`)** como para las **Tiendas Individuales de cualquier Giro de Restaurante (`/[slug]`)** y los paneles operativos.

> **Regla de Desacoplamiento Multi-Tenant:**
> Las estructuras descritas en este documento son **patrones de diseño y anatomía de componentes**, nunca contenido estático ni una obligación de convertir todas las rutas en el catálogo de un restaurante específico. Cada vista (`PlatformLandingView`, `RestaurantStorefrontView`, `/login`, `/sucursales`, `/rastreo`, `/checkout`) aplica estos mismos principios visuales a su propia función de negocio.

---

## 1. Identidad Visual: Gastronomía Contemporánea de Alta Conversión

La plataforma combina la calidez apetitosa de la gastronomía artesanal y moderna (pizzerías, hamburgueserías, sushi, cafeterías, cocina de autor, asaderos y franquicias) con la ergonomía visual y comercial de cadenas líderes de alta conversión:
* **Sensación:** Apetitosa, luminosa, directa, moderna y de alta tecnología operativa.
* **Paleta Dinámica Multi-Tenant:**
  - En la **Landing de la Plataforma (`/`)** y como valor base del sistema: Rojo Vivo Comercial (`#e4002b`) como color primario de acción (`--brand-primary`), acompañado de Dorado/Ámbar (`#f59e0b`) como acento (`--brand-accent`).
  - En cada **Tienda de Restaurante (`/[slug]`)**: Los tokens `--brand-primary` y `--brand-accent` se inyectan dinámicamente en tiempo real desde la configuración de marca del establecimiento (`PrimaryColorHex` y `AccentColorHex`).
* **Prohibición de Colores Deslavados en Fondos, Iconos y Palabras:** Prohibido el uso de tonos pastel, rosáceos o deslavados (`bg-brand-primary-light`, `#fee2e2`, `bg-brand-primary/10`, `bg-brand-primary/20`, `bg-red-50`, `bg-emerald-50`) en tarjetas, badges, palabras o detrás de iconos. Queda estrictamente prohibido encerrar iconos o palabras dentro de cajitas o píldoras con fondos desteñidos. Los fondos deben ser blancos puros (`#ffffff`), grises neutros limpios (`#f9fafb`, `neutral-100`) o negro carbón (`#09090b`), manteniendo los iconos y el color primario limpios, directos y con alto contraste.

---

## 2. Arquitectura Visual de Dos Entornos

La interfaz está rigurosamente dividida según el contexto operacional del usuario:

### 2.1. Entorno Comercial B2C y Plataforma Pública (Landing `/`, Tiendas `/[slug]`, Sucursales, Checkout y Rastreo)
* **Estilo:** Modo Claro Comercial Luminoso (con soporte para temas oscuros gourmet cuando la plantilla del restaurante así lo defina).
* **Fondo General del Canvas:** `--surface-canvas` (`#f9fafb`).
* **Superficies y Tarjetas:** Blanco puro (`#ffffff`) con bordes calibrados `border-neutral-200` y radios amplios (`rounded-3xl`).
* **Encabezado Comercial:** Fondo blanco limpio (`bg-white border-b border-neutral-200/80 shadow-xs h-[70px] sm:h-[76px]`), centrado con `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` sin líneas gruesas inferiores.
* **Botones de Acción:** Botones píldora completamente redondeados (`rounded-full`) en el color primario de marca (`bg-brand-primary hover:bg-brand-primary-hover text-white shadow-md active:scale-95`).

### 2.2. Entorno Operativo B2B (Dashboard KDS Cocina, Turnos de Caja, Inventario, Personalización y SuperAdmin)
* **Estilo:** Modo Oscuro Antirreflejos de Alta Tecnología.
* **Propósito:** Optimizado para pantallas táctiles industriales de 1080p en entornos de cocina y operación continua con reflejos de luz.
* **Fondo Principal:** Negro carbón profundo `--surface-dark` (`#09090b`).
* **Superficies de Comandas y Paneles:** `bg-surface-dark-card` (`#18181b`) con bordes en `border-surface-dark-border` (`#27272a`).
* **Texto Inverso:** Blanco neutro `--text-inverse-strong` (`#fafafa`) y gris suave `--text-inverse-muted` (`#a1a1aa`).

---

## 3. Paleta de Colores y Design Tokens Globales (`globals.css`)

```css
:root {
  /* Marca Primaria (Sobrescribible dinámicamente por Tenant en /[slug]) */
  --brand-primary: #e4002b;
  --brand-primary-hover: #c40024;
  --brand-primary-light: #fee2e2;
  --brand-primary-muted: rgba(228, 0, 43, 0.12);

  /* Acento Gastronómico (Sobrescribible dinámicamente por Tenant en /[slug]) */
  --brand-accent: #f59e0b;
  --brand-accent-hover: #d97706;
  --brand-accent-light: #fef3c7;
  --brand-accent-muted: rgba(245, 158, 11, 0.12);

  /* Superficies en Modo Claro (Landing Plataforma / Storefront / Checkout) */
  --surface-canvas: #f9fafb;
  --surface-card: #ffffff;
  --surface-card-hover: #f3f4f6;
  --surface-border: #e5e7eb;
  --surface-border-subtle: #f3f4f6;

  /* Superficies en Modo Oscuro (KDS Cocina / Dashboard / SuperAdmin) */
  --surface-dark: #09090b;
  --surface-dark-card: #18181b;
  --surface-dark-hover: #27272a;
  --surface-dark-border: #27272a;
  --surface-dark-border-subtle: #3f3f46;

  /* Tipografía y Contraste */
  --text-strong: #0f172a;
  --text-base: #334155;
  --text-muted: #64748b;
  --text-subtle: #94a3b8;
  --text-inverse-strong: #fafafa;
  --text-inverse-base: #d4d4d8;
  --text-inverse-muted: #a1a1aa;

  /* Estados Semánticos de Operación */
  --status-success: #16a34a;
  --status-success-bg: rgba(22, 163, 74, 0.12);
  --status-warning: #f59e0b;
  --status-warning-bg: rgba(245, 158, 11, 0.12);
  --status-danger: #dc2626;
  --status-danger-bg: rgba(220, 38, 38, 0.12);
  --status-info: #0284c7;
  --status-info-bg: rgba(2, 132, 199, 0.12);
}
```

---

## 4. Patrones de Componentes Reutilizables del Sistema Visual

Estos 7 patrones definen **cómo se construyen los bloques visuales** cuando una página los necesita. Se aplican adaptando su contenido al propósito de cada ruta (`/` para el directorio y afiliación de la plataforma; `/[slug]` para el catálogo de un restaurante; `/login` para autenticación):

### 4.1. Patrón de Header Comercial Adaptativo (`layout.tsx`)
* **Dimensiones y Contenedor:** Altura fija de `h-[70px] sm:h-[76px]`, fondo blanco puro (`bg-white border-b border-neutral-200/80 shadow-xs`), centrado con `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`.
* **Identidad Contextual (Izquierda):**
  - En la **raíz `/` (Landing de la Plataforma)**: Muestra la marca global (`DELIVERY PLATFORM`) y el subtítulo del ecosistema (`ECOSISTEMA DE RESTAURANTES & DELIVERY`).
  - En **`/[slug]` (Tienda de un Restaurante)**: Muestra el logotipo propio del establecimiento (`LogoUrl`) y su nombre y giro (`{BRAND}` / `{TAGLINE}`) en `font-display font-black text-2xl sm:text-[26px] tracking-tight text-brand-primary uppercase`.
* **Navegación Principal (Centro):** Enlaces directos en `font-semibold text-neutral-800 hover:text-brand-primary` adaptados al contexto (`/#restaurantes` en la raíz vs `/[slug]#catalogo` dentro de una tienda).
* **Controles Operativos y Carrito (Derecha):**
  - **Conmutador Multi-Tenant (`TenantSwitcher`):** Cápsula con punto pulsante de estado en vivo para cambiar rápidamente entre restaurantes afiliados o volver a la portada.
  - **Buscador Rápido:** Barra píldora redondeada (`rounded-full bg-[#f8f7f5] border border-neutral-200/60`).
  - **Acceso a Perfil (`/login`) y Bolsa de Compras (`CartButtonBadge`)** con contador circular en `bg-brand-primary text-white text-xs font-black`.

### 4.2. Patrón de Hero Panorámico a Sangre (`w-full`)
* **Aplicación:** Portada de la plataforma (`PlatformLandingView.tsx`) o carrusel promocional de restaurante (`CatalogHero.tsx`).
* **Extensión Espacial:** Ocupa el ancho completo de la ventana (`w-full`) sin márgenes laterales artificiales, con fotografía gastronómica real y recubrimiento oscuro graduado (`from-black/95 via-black/75 to-black/30`) para máxima legibilidad.
* **Anatomía Interna:**
  - **Badge Superior Sólido:** Cápsula en color primario `bg-brand-primary text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full`.
  - **Titular Display:** Texto en `Barlow Condensed font-black text-4xl sm:text-6xl md:text-7xl text-white uppercase tracking-tight drop-shadow-lg`.
  - **Párrafo Descriptivo:** Texto en `text-xs sm:text-sm text-white/90 max-w-xl font-medium leading-relaxed`.
  - **Botones CTA Píldora:** Primario en `bg-brand-primary text-white rounded-full py-3.5 px-8 text-xs font-black uppercase tracking-wider shadow-xl` y secundario en `bg-black/40 border border-white/30 text-white rounded-full py-3.5 px-6 text-xs font-black uppercase tracking-wider backdrop-blur-sm`.

### 4.3. Patrón de Bloque de Acción Dual Centrado (`max-w-[760px]`)
* **Aplicación:** Selector de modalidad en tienda (`A DOMICILIO` / `RECOGE EN LOCAL` en `OrderModeSelector.tsx`) o selector de flujo principal en la plataforma (`ELEGIR RESTAURANTE` / `AFILIAR MI RESTAURANTE` en `PlatformLandingView.tsx`).
* **Estructura:** Centrado con `max-w-[760px] mx-auto text-center`, encabezado en `Barlow Condensed font-black text-2xl sm:text-3xl uppercase` y dos tarjetas interactivas redondeadas (`rounded-2xl sm:rounded-3xl py-5 px-6 shadow-md transition-all active:scale-95`), acompañadas opcionalmente de una cápsula horizontal inferior (`rounded-full border border-neutral-300 bg-white`).

### 4.4. Patrón de Banners Fotográficos a 2 Columnas
* **Aplicación:** Destacados de marca en tienda (`PromotionalBanners.tsx`) o bloques de arquitectura/valor en la landing de plataforma.
* **Estructura:** Cuadrícula de 2 columnas (`grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 max-w-[1240px] mx-auto`), altura mínima `min-h-[280px] sm:min-h-[320px]`, `rounded-3xl overflow-hidden relative shadow-lg`, fotografía de fondo con degradado negro profundo y botones píldora de alto contraste (`bg-brand-primary text-white` o `bg-white text-brand-primary`).

### 4.5. Patrón de Encabezado de Sección y Filtros Tipo Cápsula
* **Eyebrow de Sección:** Etiqueta superior en color primario `text-[11px] font-bold uppercase tracking-widest text-brand-primary block mb-1`.
* **Título Principal:** En `Barlow Condensed font-black text-3xl sm:text-4xl text-neutral-900 uppercase tracking-wide font-display`.
* **Filtros Horizontales (Cuando aplica):** Píldoras redondeadas (`rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wider font-display`), con estado activo en `bg-brand-primary text-white` e inactivo en `bg-white border border-neutral-200 text-neutral-700`.

### 4.6. Patrón de Tarjeta Comercial en Grid de 3 Columnas
* **Aplicación:** Tarjeta de producto en el menú de un restaurante (`ProductCard.tsx`) o tarjeta de establecimiento afiliado en el directorio de la plataforma (`PlatformLandingView.tsx`).
* **Cuerpo de la Tarjeta:** Fondo blanco puro (`bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-neutral-300 transition-all duration-300`).
* **Fotografía Superior:** Proporción `aspect-[16/10] sm:aspect-[4/3]` con zoom suave al hover (`group-hover:scale-105 duration-500 ease-out`).
* **Badges Superiores Flotantes (`backdrop-blur-md`):**
  - Izquierdo: Píldora blanca traslúcida con texto oscuro (`bg-white/95 backdrop-blur-md text-neutral-900 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm`).
  - Derecho: Píldora negra traslúcida con texto blanco (`bg-black/65 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm`).
* **Contenido y Fila Inferior de Acción:**
  - Título en `Barlow Condensed font-black text-xl text-neutral-900 uppercase tracking-tight font-display`.
  - Descripción limpia en `text-xs text-neutral-600 line-clamp-2`.
  - Pie separado por `border-t border-neutral-100 pt-3 flex items-center justify-between` con etiqueta superior en `text-[10px] font-bold text-neutral-500 uppercase`, importe numérico en cifras tabulares (`font-mono text-2xl font-black text-neutral-950 tabular-nums`) y botón píldora en `bg-brand-primary text-white rounded-full py-3 px-6 text-xs font-black uppercase tracking-wider`.

### 4.7. Patrón de Formulario en Cuadrícula Asimétrica 4/8 (`/login` y Registro de Tenants)
* **Estructura:** Cuadrícula `grid-cols-1 lg:grid-cols-12 gap-8 items-start`.
* **Columna Izquierda (`lg:col-span-4`):**
  - Tarjeta de valor en color primario sólido (`bg-brand-primary text-white rounded-3xl p-6 shadow-sm`) con eyebrow en ámbar, titular en `Barlow Condensed` y descripción.
  - Tarjeta blanca complementaria (`bg-white border border-neutral-200/90 rounded-3xl p-4 shadow-xs divide-y divide-neutral-100`).
* **Columna Derecha (`lg:col-span-8`):**
  - Tarjeta blanca amplia (`bg-white border border-neutral-200/90 rounded-3xl p-8 sm:p-12 shadow-sm`) con inputs en gris suave (`bg-neutral-50 border border-neutral-200 rounded-xl min-h-[48px] px-4 py-2.5 text-sm`) y botón de envío píldora (`w-full min-h-[50px] bg-brand-primary text-white font-black text-sm uppercase tracking-wider font-display rounded-full`).

---

## 5. Sistema Tipográfico Estricto (2 Familias Calibradas)

La plataforma utiliza estrictamente dos familias tipográficas calibradas, sin añadir una tercera fuente externa:

1. **Titulares, Display, Logotipo y Botones de Acción Primaria (`--font-display`):**
   - **Fuente:** `Barlow Condensed` (pesos `700 Bold`, `800 ExtraBold` y `900 Black`).
   - **Aplicación:** Siempre en mayúsculas (`uppercase tracking-wide` o `tracking-wider`).
   - **Uso:** Encabezados de sección (`h1`, `h2`), títulos de tarjetas, botones de acción, títulos de modales y marca.

2. **Cuerpo de Lectura, Formularios, Controles y Metadatos (`--font-sans`):**
   - **Fuente:** `Inter` (pesos `400 Regular`, `500 Medium` y `600 SemiBold`).
   - **Aplicación:** Descripciones, campos de texto, tablas, badges y textos legales.

3. **Precios e Importes Numéricos (Cero Tercera Fuente):**
   - Se utilizan las **cifras tabulares nativas de `Inter`** mediante la utilidad `font-mono tabular-nums` (`font-feature-settings: "tnum" 1`).
   - Alinea importes monetarios en columnas sin vibraciones visuales y sin recargar fuentes externas.

---

## 6. Sistema de Barras de Desplazamiento Ergonómicas (`ScrollArea`)

Para eliminar las barras de desplazamiento toscas y flechas nativas del sistema operativo:

1. **Supresión Absoluta de Flechas Nativas:**
   ```css
   *::-webkit-scrollbar-button,
   ::-webkit-scrollbar-button {
     display: none !important;
     width: 0 !important;
     height: 0 !important;
   }
   ```
2. **Barra Flotante Minimalista:**
   - Grosor estándar de `7px`, track transparente y píldora oscura flotante (`#262329`) con bordes redondeados (`rounded-full`).
3. **Componente Reutilizable `ScrollArea`:**
   - Ubicación: `frontend/src/shared/components/ScrollArea.tsx`.
   - Soporte para sombras progresivas de desplazamiento (`scrollShadows`) y variantes `brand`, `dark`, `subtle`.

---

## 7. Responsividad Universal, Modo PC y Ergonomía en Todos los Tamaños de Pantalla

El sistema visual y todos sus componentes deben diseñarse de forma nativa e innegociable **tanto para Modo PC / Escritorio (1280px a 1920px+) como para un comportamiento completamente responsive adaptado a todos los tamaños de pantalla** (smartphones 360px-480px, tablets 768px-1024px, laptops y monitores ultra-wide):

* **Modo PC / Desktop (>= 1280px):**
  - Interfaces de alta resolución con navegación horizontal o lateral extendida, sin colapsar menús ni ocultar accesos clave.
  - Tableros operativos y vistas de gobernanza con distribución multidimensional (tableros KDS en 3 columnas simultáneas, tablas de inventario completas, vistas de dos columnas en pedidos y checkout).
  - Máximo aprovechamiento del ancho de pantalla con contenedores centrados (`max-w-7xl` o `max-w-6xl`) y márgenes balanceados.
* **Tablets y Laptops (768px a 1024px):**
  - Transición fluida a rejillas de 2 columnas (`md:grid-cols-2`), selectores y botones de tamaño medio y modales con padding equilibrado.
* **Smartphones y Pantallas Pequeñas (360px a 480px):**
  - **Cero Desbordamiento Horizontal:** Prohibido el uso de anchos rígidos en píxeles que superen 320px. Los contenedores y menús desplegables deben emplear anchos adaptables (`w-[calc(100vw-2rem)] max-w-xs sm:w-80`).
  - **Navegación Móvil:** Integración de cajón deslizante (`MobileNavDrawer`) y barra de navegación inferior fija (`MobileBottomNav`) con soporte explícito para el área segura de dispositivos móviles (`safe-area-inset-bottom`).
  - **Vistas en Tarjetas para Tablas:** Las tablas de datos administrativas deben presentar una vista alternativa en tarjetas individuales (`md:hidden`) optimizadas para lectura vertical.
  - **Modales Adaptables:** Altura contenida (`max-h-[92vh] flex flex-col`) con cabecera y pie fijos (`shrink-0`) y formulario interno con desplazamiento independiente (`overflow-y-auto overscroll-contain`).
  - **Zonas de Pulsación (Touch Targets):** Todo botón interactivo, selector de modificador, casilla o campo de formulario debe tener una dimensión mínima de `44px` (ideal `48px`).
* **Micro-Interacciones Hápticas:**
  - Reducción visual al pulsar: `active:scale-95`.
  - Transiciones suaves y consistentes: `transition-all duration-200 ease-out`.
  - Pulso continuo en estados satelitales GPS en vivo: `animate-pulse` o `animate-ping`.

---

## 8. Accesibilidad (WCAG 2.1 AA)

* **Contraste de Color:** Mínimo de 4.5:1 en textos estándar sobre fondo blanco o carbón, y 3:1 en botones y controles.
* **Anillos de Foco Visibles:** Anillo de foco accesible (`focus-visible:ring-2 focus-visible:ring-brand-primary focus:outline-none`).
* **Semántica HTML5 Estricta:** Uso de `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<button>`. Prohibido crear botones mediante etiquetas `<div>` o `<span>` sin soporte de teclado y accesibilidad.

---

## 9. Prohibiciones Técnicas y Restricciones Estéticas Innegociables

1. **Cero Emojis:** Queda estrictamente prohibido el uso de emojis en cualquier componente, botón, título, badge, alerta, commit o documentación.
2. **Cero KPIs Gigantes:** Prohibido el uso de métricas desproporcionadas en paneles operativos (`text-5xl`, `text-6xl`). Totales y cifras se mantienen compactas y equilibradas (`text-xl` a `text-2xl font-black font-mono`).
3. **Mínimos Iconos SVG (Uso Exclusivamente Esencial):**
   - Prohibido saturar la interfaz con iconos decorativos en cada botón o enlace.
   - Los iconos SVG se limitan a acciones donde el texto no es suficiente (cerrar modal `X`, feedback de carga `Loader2`, flecha de retroceso o pines de mapa). Si un botón ya indica `+ PEDIR`, `VER TIENDA` o `ACCEDER AL SISTEMA`, no debe acompañarse de un SVG redundante.
4. **Prohibido Badges/Pills de Estado Decorativas con Iconos SVG:**
   - Prohibido utilizar píldoras pastel (ej. verde `bg-status-success/15` con escudos `ShieldCheck`, candados o checks) con palabras obvias como "ABIERTO", "ACTIVO", "OPERATIVA" o "SEGURO".
5. **Prohibido Fondos Rosáceos, Pastel o Deslavados en Iconos y Palabras:**
   - Prohibido el uso de `bg-brand-primary-light`, transparencias bajas (`bg-brand-primary/10`, `bg-emerald-500/20`, `bg-red-50`) o cajitas desteñidas detrás de iconos o palabras (ej. encerrar un icono `MapPin`, `Phone` o un texto de badge en un recuadro rosado o pastel).
   - Los iconos deben colocarse limpios directamente sobre la superficie o con un icono en color directo/neutro sin envoltorios desteñidos. Las palabras y etiquetas nunca deben llevar cajas o fondos con tintes lavados o rosáceos.
6. **Prohibido Marcos Envolventes Innecesarios en Palabras y Puntos Parpadeantes:**
   - Prohibido encerrar palabras de estado (ej. "ABIERTO AHORA") dentro de cápsulas, recuadros o píldoras envolventes artificiales (`rounded-full bg-neutral-900`). Los indicadores de estado deben comunicarse con tipografía limpia y directa sin marcos envolventes.
   - Prohibido el uso de puntos parpadeantes (`animate-ping` o `animate-pulse`) junto a etiquetas de estado o tarjetas.
7. **Prohibido `!important` y Estilos Inline Aleatorios:**
   - Todo estilo debe resolverse mediante Tailwind CSS y las variables CSS del tema activo.
8. **Prohibido Desbordamientos Horizontales:**
   - El diseño debe ser 100% responsivo y fluido desde una anchura mínima de 360px hasta monitores ultrapanorámicos.
