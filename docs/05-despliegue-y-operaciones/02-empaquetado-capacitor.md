# 02. Empaquetado Movil con Capacitor

## 1. Descripcion General
La aplicacion movil se genera a partir de la misma base de codigo de Next.js mediante Capacitor (`@capacitor/core`, `@capacitor/cli`, `@capacitor/android`), eliminando la necesidad de mantener un repositorio o framework movil separado.

## 2. Archivo de Configuracion (`capacitor.config.ts`)

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.delivery.app',
  appName: 'Delivery App',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  plugins: {
    Geolocation: {
      enableHighAccuracy: true,
    },
  },
};

export default config;
```

## 3. Flujo de Trabajo para Generacion de APK / Android Studio

1. **Compilar el Frontend Next.js para Exportacion:**
   ```powershell
   cd frontend
   pnpm build
   ```

2. **Sincronizar Recursos Web con el Proyecto Nativo:**
   ```powershell
   pnpm cap:sync
   ```

3. **Abrir el Proyecto en Android Studio:**
   ```powershell
   npx cap open android
   ```

---

## Navegacion de Documentacion
* **Anterior:** [01. Infraestructura Local con Docker Compose](./01-infraestructura-docker.md)
* **Siguiente:** [03. Guia Tecnica de CI/CD, Despliegue Automatizado y Rollback](./03-guia-despliegue-devops.md)
* **Indice General:** [README Principal](../../README.md)
