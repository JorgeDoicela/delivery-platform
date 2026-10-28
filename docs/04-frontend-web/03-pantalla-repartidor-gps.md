# 03. Herramienta Movil del Repartidor y Telemetria GPS

## 1. Descripcion General
La vista `src/app/(driver)/active-delivery/page.tsx` esta optimizada para su uso en smartphones por parte de los motorizados de entrega, ofreciendo transmision GPS en segundo plano y enlaces de navegacion asistida.

## 2. Componentes y Hook de Telemetria

```
src/features/tracking/
└── hooks/
    └── useDriverTracking.ts       # Hook de transmision continua a Redis GEO
```

## 3. Funcionalidades Principales

### 3.1. Telemetria GPS y Modo Simulacion
* **Geolocalizacion Satelital Real:** Utiliza `navigator.geolocation.watchPosition` con `enableHighAccuracy: true` y publica las coordenadas hacia `POST /api/tracking/driver-location`.
* **Modo de Simulacion Integrado:** Permite a los desarrolladores y operadores probar la transmision de ruta en entornos locales (`localhost`) donde el navegador no emite cambios de coordenadas fisicas. El hook interpola las coordenadas paso a paso en intervalos de 4 segundos rumbo al destino final.

### 3.2. Enlaces Profundos a Navegadores (Deep Links)
Para no forzar la integracion de navegadores pesados dentro de la aplicacion web, se proveen accesos directos nativos a las aplicaciones de ruta instaladas en el dispositivo:
* **Google Maps:** `https://www.google.com/maps/dir/?api=1&destination={latitude},{longitude}`
* **Waze:** `https://waze.com/ul?ll={latitude},{longitude}&navigate=yes`

### 3.3. Liquidacion en Entrega y Confirmacion de Cobro
En pedidos con modalidad de pago en efectivo (`Cash`), la pantalla muestra de forma destacada:
* Total exacto a cobrar.
* Denominacion del billete con el que cancelara el cliente (`cashAmountPaid`).
* Vuelto exacto a entregar (`changeDue`).
* Boton de confirmacion que finaliza la orden en el servidor (`Delivered`) y detiene la transmision GPS.

---

## Navegacion de Documentacion
* **Anterior:** [02. Pantalla de Cocina y Kitchen Display System (KDS)](./02-pantalla-cocina-kds.md)
* **Siguiente:** [01. Infraestructura Local con Docker Compose](../05-despliegue-y-operaciones/01-infraestructura-docker.md)
* **Indice General:** [README Principal](../../README.md)
