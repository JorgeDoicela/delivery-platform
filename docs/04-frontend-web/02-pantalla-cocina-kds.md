# 02. Pantalla de Cocina y Kitchen Display System (KDS)

## 1. Descripcion General
El modulo KDS ubicado en `frontend/src/features/kitchen/` y renderizado en `src/app/(dashboard)/kitchen/page.tsx` proporciona una interfaz interactiva de despacho para los maestros asadores y personal de cocina.

## 2. Componentes del Modulo

```
src/features/kitchen/
├── components/
│   └── KitchenTicketCard.tsx       # Tarjeta de comanda individual con semaforo
├── hooks/
│   └── useKitchenOrders.ts        # Logica SignalR, polling de respaldo y avance
└── lib/
    └── sound.ts                   # Sintetizador nativo Web Audio API
```

## 3. Comportamiento Operativo y Reglas FIFO

1. **Orden de Despacho Estricto (FIFO):**
   Las comandas se ordenan de izquierda a derecha y de arriba hacia abajo segun `CreatedAt ASC`. La comanda mas antigua siempre aparece en primer lugar para garantizar tiempos justos de atencion.

2. **Columnas del Tablero Kanban:**
   * **En Espera (Confirmados):** Comandas recien ingresadas al sistema (`status === OrderStatus.Confirmed`).
   * **En Preparacion (Horno):** Comandas que el cocinero ha tomado para produccion activa (`status === OrderStatus.InKitchen`).
   * **Listos para Despacho:** Pedidos empaquetados esperando entrega a repartidor o cliente (`status === OrderStatus.ReadyForDelivery`).

3. **Semaforo Visual de Tiempos:**
   El componente calcula en segundo plano cada 30 segundos los minutos transcurridos:
   * **Verde (`< 15 min`):** Tiempo optimo de coccion y despacho.
   * **Ambar (`15 - 25 min`):** Tiempo limite de tolerancia en cocina.
   * **Rojo Intermitente (`> 25 min`):** Alerta critica por posible retraso en horno.

## 4. Alerta Sonora con Web Audio API

Para evitar archivos `.mp3` pesados o dependencias bloqueadas por politicas de navegadores, el sistema sintetiza dos frecuencias audibles puras directamente en el chip de audio mediante `KitchenAudioAlert`:
* Oscilador 1: Onda senoidal a 587.33 Hz (Re5).
* Oscilador 2: Onda triangular con modulacion hacia 1174.66 Hz (Re6).
* Duracion total: 450 milisegundos con decaimiento exponencial suave.

---

## Navegacion de Documentacion
* **Anterior:** [01. Estructura de Rutas y Route Groups en Frontend](./01-estructura-route-groups.md)
* **Siguiente:** [03. Herramienta Movil del Repartidor y Telemetria GPS](./03-pantalla-repartidor-gps.md)
* **Indice General:** [README Principal](../../README.md)
