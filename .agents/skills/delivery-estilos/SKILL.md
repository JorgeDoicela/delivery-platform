---
name: delivery-estilos
description: Sistema de diseño, UI/UX premium y guía de estilos para Delivery Platform (Paleta asadero carbón/ámbar, cero emojis, cero KPIs enormes, mínimo uso de iconos SVG, accesibilidad WCAG y diseño ergonómico).
---
# Sistema de Diseño y Guía de Estilos para Delivery Platform

Esta habilidad define los principios visuales, tokens de diseño, criterios de experiencia de usuario (UX) y estándares de accesibilidad para la interfaz de Delivery Platform.

---

## 1. Identidad Visual: Asadero Artesanal Premium

La identidad estética combina la elegancia contemporánea con los atributos gastronómicos de un asadero tradicional de pollos y carnes a la brasa:
* **Sensación:** Cálida, limpia, apetitosa y de alta tecnología.
* **Tonalidades Base:** Carbón intenso, brasa encendida, acentos tostados y contrastes definidos.
* **Prohibición Estricta:** Prohibido el uso de colores planos genéricos sin calibrar (ej. rojo puro `#ff0000` o azul primario `#0000ff`). Todos los tonos deben derivar de la paleta calibrada.

---

## 2. Paleta de Colores y Design Tokens

### 2.1. Modo Oscuro (Storefront Hero, Tracking y KDS)
* **Fondo Principal:** `neutral-950` (`#0a0a0a`) - Profundo, reduce el cansancio visual en cocina y resalta los productos.
* **Superficies y Tarjetas:** `neutral-900` (`#171717`) con bordes sutiles en `neutral-800` (`#262626`).
* **Superficies Interactivas Elevadas:** `neutral-800/80` con desenfoque de fondo (`backdrop-blur-md`).
* **Texto Principal:** `neutral-50` (`#fafafa`) y `neutral-200` (`#e5e5e5`).
* **Texto Secundario / Metadatos:** `neutral-400` (`#a3a3a3`) y `neutral-500` (`#737373`).

### 2.2. Acentos Gastronómicos (Fuego y Brasa)
* **Primario (Ámbar Dorado):** `amber-500` (`#f59e0b`) y `amber-400` (`#fbbf24`). Empleado en estados de preparación, botones de acción primaria y badges de cocción.
* **Secundario (Naranja Brasa):** `orange-600` (`#ea580c`) y `orange-500` (`#f97316`). Empleado en indicadores de oferta, pines de destino y alertas de alta demanda.
* **Resaltado y Halos:** `amber-500/20` o `orange-500/20` para sombras volumétricas y efectos de pulso.

### 2.3. Modo Claro Funcional (Formularios de Checkout y Facturación)
* **Fondo:** `white` (`#ffffff`) y `slate-50` (`#f8fafc`).
* **Bordes y Divisores:** `slate-200` (`#e2e8f0`).
* **Texto Primario:** `slate-900` (`#0f172a`).

### 2.4. Colores Semánticos de Operación
* **Éxito (Entregado / Pagado):** `emerald-600` (`#16a34a`) con fondo `emerald-950/40`.
* **Atención / En Horno:** `amber-500` (`#f59e0b`) con fondo `amber-950/40`.
* **Cancelado / Error:** `red-600` (`#dc2626`) con fondo `red-950/40`.
* **En Camino (Despachado):** `blue-500` (`#3b82f6`) con halo dinámico.

---

## 3. Tipografía y Jerarquía (Sistema Estricto de 2 Fuentes)

La plataforma utiliza estrictamente dos familias tipográficas calibradas, sin añadir una tercera fuente externa:
* **1. Titulares, Display y Botones de Acción Primaria (`--font-display`):** `Barlow Condensed` (pesos `700 Bold`, `800 ExtraBold` y `900 Black`).
  - Empleada en mayúsculas (`uppercase tracking-wide` o `tracking-wider`) para encabezados de sección, nombres de combos, logotipo y badges de marca (estética artesanal de fuego inspirada en El Pollo Loco).
* **2. Cuerpo, Controles, Modales y Precios (`--font-sans`):** `Inter` (pesos `400 Regular`, `500 Medium` y `600 SemiBold`).
  - Cero tercera fuente para cifras o precios: Se activan las cifras tabulares de la propia fuente `Inter` (`font-mono tabular-nums` con `font-feature-settings: "tnum" 1`) para alinear importes sin oscilaciones visuales.
* **Escala Tipográfica:**
  - Encabezados principales: `text-2xl` a `text-4xl font-black uppercase tracking-wide`.
  - Títulos de tarjeta / Combos: `text-base` a `text-lg font-bold text-text-strong`.
  - Texto de lectura y descripciones: `text-xs` a `text-sm font-normal leading-relaxed text-text-muted`.
  - Importes y precios: `text-sm` a `text-lg font-black font-mono tabular-nums`.
  - Etiquetas compactas y metadatos: `text-[10px]` y `text-[11px] font-bold uppercase tracking-wider`.

---

## 4. Ergonomía Táctil y Mobile-First

* **Zonas de Pulsación (Touch Targets):**
  - Cualquier botón interactivo, selector o casilla en móvil debe tener una dimensión mínima de `44px` (ideal `48px`) para evitar pulsaciones erróneas de repartidores con guantes o clientes en smartphones.
* **Micro-Interacciones:**
  - Retroalimentación háptica visual en botones mediante escalado sutil: `active:scale-95`.
  - Transiciones suaves y consistentes: `transition-all duration-200 ease-out`.
  - Pulso continuo para indicadores de seguimiento GPS activo: `animate-pulse` o `animate-ping`.

---

## 5. Accesibilidad (WCAG 2.1 AA)

* **Contraste de Color:**
  - Relación de contraste mínima de 4.5:1 para texto estándar y 3:1 para texto de gran tamaño o controles de interfaz.
* **Estados de Foco:**
  - Todo elemento interactivo debe disponer de anillo de foco visible (`focus-visible:ring-2 focus-visible:ring-amber-500/50 focus:outline-none`).
* **Semántica:**
  - Empleo de elementos semánticos de HTML5 (`<main>`, `<nav>`, `<section>`, `<header>`, `<button>`). Prohibido sustituir enlaces o botones por `<div>` sin atributos ARIA ni soporte de teclado.

---

## 6. Prohibiciones Técnicas y Restricciones Estéticas Estrictas

* **Cero Emojis:** Prohibido el uso de emojis en cualquier componente, botón, título, badge, alerta o texto de la interfaz. La comunicación visual debe ser 100% profesional, sobria y fáctica.
* **Cero KPIs Enormes:** Prohibido el uso de tipografía desproporcionada o métricas gigantescas (ej. `text-5xl`, `text-6xl` o bloques masivos de KPIs decorativos). Las cifras clave y totales deben mantener proporciones compactas y equilibradas (`text-xl` a `text-2xl font-bold font-mono`).
* **Mínimos Iconos SVG (Uso Exclusivamente Esencial):** Prohibido saturar la interfaz con iconos en cada botón, título, enlace o tarjeta. Los iconos SVG quedan reservados únicamente a casos donde la funcionalidad no puede comunicarse solo con texto (ej. botón de cierre `X`, feedback de carga activa, o marcadores de ubicación en mapas). Si un botón o texto se comprende de forma autónoma, no debe incluir SVG.
* **Prohibido Badges/Pills de Estado Decorativas con Iconos SVG:** Queda terminantemente prohibido el uso de insignias o píldoras con fondos pastel (ej. verde `bg-status-success/15` o similares), iconos SVG decorativos (como escudos `ShieldCheck`, checks o candados) y palabras redundantes u obvias como "ABIERTO", "OPERATIVA", "ACTIVO" o similares. Rompen la estética gastronómica limpia y saturan visualmente la interfaz simulando software corporativo o antivirus. Si se requiere comunicar disponibilidad o estado, debe hacerse mediante tipografía sobria, datos contextuales o de forma implícita en el flujo operativo sin cápsulas decorativas.
* **Prohibido `!important`:** Todo conflicto de especificidad debe resolverse ajustando el orden o utilizando capas de Tailwind / CSS estructurado.
* **Prohibido Estilos Inline Aleatorios:** Estilos visuales como colores de fondo, márgenes y tipografías deben definirse con los tokens globales de CSS y utilidades predecibles.
* **Prohibido Desbordamientos Horizontales:** El diseño debe ser 100% responsivo y fluido desde una anchura mínima de 360px hasta monitores ultrapanorámicos.
