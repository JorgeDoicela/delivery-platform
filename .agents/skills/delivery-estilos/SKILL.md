---
name: delivery-estilos
description: Sistema de diseño, UI/UX premium y guía de estilos para Delivery Platform (Paleta fast-food asadero estilo KFC/La Granjita, modo claro comercial en Storefront, modo oscuro antirreflejo en KDS, tipografía dual Barlow/Inter, scrollbars flotantes sin flechas, cero emojis y ergonomía táctil).
---
# Sistema de Diseño y Guía de Estilos Oficial (Delivery Platform)

Esta habilidad define los principios visuales, tokens de diseño, criterios de experiencia de usuario (UX), componentes canónicos y estándares de accesibilidad para la interfaz de Delivery Platform (La Granjita Asadero).

---

## 1. Identidad Visual: Fast-Food Asadero Contemporáneo

La plataforma unifica la calidez gastronómica de un asadero artesanal de pollos y carnes a la brasa con la ergonomía visual y comercial de cadenas líderes de alta conversión (inspirado en la arquitectura limpia de KFC y la fuerza tipográfica de El Pollo Loco):
* **Sensación:** Apetitosa, luminosa, directa, moderna y de alta tecnología operativa.
* **Paleta Protagónica:** Rojo Vivo Asadero (`#e4002b`) como color primario de acción comercial, acompañado de Dorado/Ámbar (`#f59e0b`) como acento gastronómico de fuego, maíz y brasa.
* **Prohibición de Colores Deslavados:** Prohibido el uso de tonos rosáceos deslavados (`bg-brand-primary-light`, `#fee2e2`, `bg-brand-primary/10` o `bg-brand-primary/20`) en tarjetas, badges o fondos. Los fondos deben ser blancos puros (`#ffffff`), grises neutros limpios (`#f9fafb`, `neutral-100`) o negro carbón (`#09090b`), manteniendo el rojo exclusivamente en estados sólidos, botones y acentos de marca.

---

## 2. Arquitectura Visual de Dos Entornos

La interfaz está rigurosamente dividida según el contexto operacional del usuario:

### 2.1. Entorno Comercial B2C (Storefront, Catálogo, Sucursales, Checkout y Rastreo)
* **Estilo:** Modo Claro Comercial Luminoso.
* **Fondo General del Canvas:** `--surface-canvas` (`#f9fafb`).
* **Superficies y Tarjetas:** Blanco puro (`#ffffff`) con bordes calibrados `border-neutral-200` y radios amplios (`rounded-3xl`).
* **Encabezado Comercial:** Fondo blanco limpio (`bg-white border-b border-neutral-200/80 shadow-xs h-[70px] sm:h-[76px]`), centrado con `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` sin líneas rojas gruesas inferiores.
* **Botones de Acción:** Botones píldora completamente redondeados (`rounded-full`) en Rojo de Marca (`bg-brand-primary hover:bg-brand-primary-hover text-white shadow-md active:scale-95`).

### 2.2. Entorno Operativo B2B (Dashboard KDS Cocina, Turnos de Caja, Inventario y Acceso)
* **Estilo:** Modo Oscuro Antirreflejos de Alta Tecnología.
* **Propósito:** Optimizado para pantallas táctiles industriales de 1080p en entornos de cocina con humo, calor y reflejos de luz.
* **Fondo Principal:** Negro carbón profundo `--surface-dark` (`#09090b`).
* **Superficies de Comandas y Paneles:** `bg-surface-dark-card` (`#18181b`) con bordes en `border-surface-dark-border` (`#27272a`).
* **Texto Inverso:** Blanco neutro `--text-inverse-strong` (`#fafafa`) y gris suave `--text-inverse-muted` (`#a1a1aa`).

---

## 3. Paleta de Colores y Design Tokens Globales (`globals.css`)

```css
:root {
  /* Marca Primaria (Rojo Fast-Food Asadero estilo KFC) */
  --brand-primary: #e4002b;
  --brand-primary-hover: #c40024;
  --brand-primary-light: #fee2e2;
  --brand-primary-muted: rgba(228, 0, 43, 0.12);

  /* Acento Gastronómico (Dorado / Ámbar Brasa) */
  --brand-accent: #f59e0b;
  --brand-accent-hover: #d97706;
  --brand-accent-light: #fef3c7;
  --brand-accent-muted: rgba(245, 158, 11, 0.12);

  /* Superficies en Modo Claro (Storefront / Checkout) */
  --surface-canvas: #f9fafb;
  --surface-card: #ffffff;
  --surface-card-hover: #f3f4f6;
  --surface-border: #e5e7eb;
  --surface-border-subtle: #f3f4f6;

  /* Superficies en Modo Oscuro (KDS Cocina / Dashboard / Login) */
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

## 4. Anatomía Canónica de la Landing Page Comercial

La página principal (`src/app/(storefront)/page.tsx`) está estructurada bajo una jerarquía visual limpia y directa:

1. **Header Comercial Estilo KFC (`layout.tsx`):**
   - Altura: `h-[70px] sm:h-[76px]`.
   - Contenedor centrado `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`.
   - Logotipo oficial a la izquierda: isotipo con llama/pollo y tipografía dual `LA GRANJITA` (Barlow Condensed rojo) + `Asadero` (subtítulo gris).
   - Navegación central con anclas suaves a la misma página: `Ordenar` (`#catalogo`), `Restaurantes` (`#sucursales`), `Rastrear Pedido` (`/rastreo`), `Nosotros` (`#sucursales`).
   - Bloque derecho: Buscador píldora gris claro (`#f8f7f5`), icono de perfil con enlace directo al portal operativo (`/login`), y bolsa de compras roja con contador numérico reactivo (`CartButtonBadge`).

2. **Gran Carrusel Panorámico Hero a Ancho Completo (`CatalogHero.tsx`):**
   - Se extiende de borde a borde de la pantalla sin restricciones artificiales de anchura (`w-full`).
   - Soporte para 3 slides fotográficos de alta resolución con relación de aspecto panorámica.
   - Micro-interacciones de cambio direccional fluido con sincronización de texto y crossfade.
   - Titulares de impacto en `Barlow Condensed font-black text-4xl sm:text-6xl text-white uppercase tracking-tight`.

3. **Selector de Modo de Pedido (`OrderModeSelector.tsx`):**
   - Dos bloques limpios inspirados en kioscos modernos ("Para Entrega a Domicilio" vs "Para Retiro en Restaurante").
   - Bordes en `neutral-200`, transiciones suaves y botones de confirmación destacados.

4. **Tarjetas Promocionales de Especialidad (`PromotionalBanners.tsx`):**
   - Banners horizontales con fotografía gastronómica real ("Hecho a la Brasa", "Receta Tradicional", "Combo Personal").
   - Radios redondeados `rounded-3xl`, texto en mayúsculas `Barlow Condensed` y botones píldora.

5. **Vitrina de Catálogo y Tarjetas de Producto (`ProductCard.tsx`):**
   - Tarjetas en blanco puro (`bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-neutral-300 transition-all duration-300`).
   - Fotografía de comida en proporción `aspect-[16/10] sm:aspect-[4/3]` con efecto de zoom suave al hover (`group-hover:scale-105 duration-500 ease-out`).
   - Badges superiores flotantes con `backdrop-blur-md` (categoría en blanco traslúcido, modificadores en negro traslúcido).
   - Título en `font-display font-black text-xl text-neutral-900 uppercase tracking-tight`.
   - Precio en `font-mono text-2xl font-black text-neutral-950 tabular-nums`.
   - Botón de acción: `bg-brand-primary hover:bg-brand-primary-hover text-white rounded-full py-3 px-6 text-xs font-black uppercase tracking-wider shadow-md hover:scale-105 active:scale-95`.

6. **Panel de Accesos Directos Operativos (Pie de Landing):**
   - Reubicado en la base de la landing (no en la cabecera comercial) para soporte a desarrolladores y supervisores sin alterar la conversión del cliente final.
   - Organizado en tarjetas redondeadas por dominio: Tienda (blanca), Cocina & Admin (oscura carbón), Repartidor (blanca).

---

## 5. Sistema Tipográfico Estricto (2 Familias Calibradas)

La plataforma utiliza estrictamente dos familias tipográficas calibradas, sin añadir una tercera fuente externa:

1. **Titulares, Display, Logotipo y Botones de Acción Primaria (`--font-display`):**
   - **Fuente:** `Barlow Condensed` (pesos `700 Bold`, `800 ExtraBold` y `900 Black`).
   - **Aplicación:** Siempre en mayúsculas (`uppercase tracking-wide` o `tracking-wider`).
   - **Uso:** Encabezados de sección (`h1`, `h2`), títulos de productos en tarjetas, botones de pedir/confirmar, títulos de modales y marca.

2. **Cuerpo de Lectura, Formularios, Controles y Metadatos (`--font-sans`):**
   - **Fuente:** `Inter` (pesos `400 Regular`, `500 Medium` y `600 SemiBold`).
   - **Aplicación:** Descripciones de producto, campos de texto, tablas, badges y textos legales.

3. **Precios e Importes Numéricos (Cero Tercera Fuente):**
   - Se utilizan las **cifras tabulares nativas de `Inter`** mediante la utilidad `font-mono tabular-nums` (`font-feature-settings: "tnum" 1`).
   - Alinea importes monetarios en columnas sin vibraciones visuales y sin recargar fuentes externas.

---

## 6. Sistema de Barras de Desplazamiento Ergonómicas (`ScrollArea`)

Para eliminar las barras de desplazamiento toscas y flechas nativas del sistema operativo (flechas grises de Windows):

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
   - Grosor estándar de `7px`.
   - Track 100% transparente (`background: transparent !important`).
   - Píldora oscura minimalista flotante (`#262329`) con bordes redondeados (`rounded-full`).
3. **Componente Reutilizable `ScrollArea`:**
   - Ubicación: `frontend/src/shared/components/ScrollArea.tsx`.
   - Soporte para sombras progresivas de desplazamiento (`scrollShadows`) para indicar contenido oculto en modales y listas.
   - Variantes integradas: `brand`, `dark`, `subtle`.

---

## 7. Ergonomía Táctil y Mobile-First

* **Zonas de Pulsación (Touch Targets):**
  - Todo botón interactivo, selector de modificador, casilla o campo de formulario debe tener una dimensión mínima de `44px` (ideal `48px`) para garantizar operatividad con una sola mano o por personal en cocina y reparto.
* **Micro-Interacciones Hápticas:**
  - Reducción visual al pulsar: `active:scale-95`.
  - Transiciones suaves y consistentes: `transition-all duration-200 ease-out`.
  - Pulso continuo en estados satelitales GPS en vivo: `animate-pulse` o `animate-ping`.

---

## 8. Accesibilidad (WCAG 2.1 AA)

* **Contraste de Color:** Mínimo de 4.5:1 en textos estándar sobre fondo blanco o carbón, y 3:1 en botones y controles.
* **Anillos de Foco Visibles:** Anillo de foco accesible sin distorsionar el diseño (`focus-visible:ring-2 focus-visible:ring-brand-primary focus:outline-none`).
* **Semántica HTML5 Estricta:** Uso de `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<button>`. Prohibido crear botones mediante etiquetas `<div>` o `<span>` sin soporte de teclado y accesibilidad.

---

## 9. Prohibiciones Técnicas y Restricciones Estéticas Innegociables

1. **Cero Emojis:** Queda estrictamente prohibido el uso de emojis en cualquier componente, botón, título, badge, alerta, commit o documentación. La estética es 100% sobria, fáctica y profesional.
2. **Cero KPIs Gigantes:** Prohibido el uso de tipografía desproporcionada o métricas gigantescas (`text-5xl`, `text-6xl`). Totales y cifras operativas se mantienen compactas y equilibradas (`text-xl` a `text-2xl font-black font-mono`).
3. **Mínimos Iconos SVG (Uso Exclusivamente Esencial):**
   - Prohibido saturar la interfaz con iconos decorativos en cada botón o enlace.
   - Los iconos SVG se limitan a acciones donde el texto no es suficiente (cerrar modal `X`, feedback de carga activa `Loader2`, flecha de retroceso o pines de mapa). Si un botón ya indica "PEDIR" o "ACCEDER AL SISTEMA", no debe acompañarse de un SVG redundante.
4. **Prohibido Badges/Pills de Estado Decorativas con Iconos SVG:**
   - Prohibido utilizar píldoras pastel (ej. verde `bg-status-success/15` con escudos `ShieldCheck`, candados o checks) con palabras obvias como "ABIERTO", "ACTIVO", "OPERATIVA" o "SEGURO". Simulan software antivirus corporativo y rompen la estética gastronómica limpia.
5. **Prohibido Fondos Rosáceos Deslavados:**
   - Prohibido el uso de `bg-brand-primary-light` o transparencias bajas de rojo en tarjetas y componentes. Los fondos de tarjetas son blancos sólidos o carbón oscuro.
6. **Prohibido `!important` y Estilos Inline Aleatorios:**
   - Todo estilo debe resolverse mediante las capas estructuradas de Tailwind CSS y tokens de diseño globales.
7. **Prohibido Desbordamientos Horizontales:**
   - El diseño debe ser 100% responsivo y fluido desde una anchura mínima de 360px hasta monitores ultrapanorámicos.
