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

### 3.1. Prerrequisitos de Entorno
* Android Studio (versión Hedgehog o superior) con Android SDK 34+.
* Java Development Kit (JDK 17 o 21).
* Node.js 20+ y pnpm 10+.

### 3.2. Permisos Satelitales en AndroidManifest.xml
Para habilitar la telemetría continua de los repartidores motorizados con la pantalla apagada o la app en segundo plano, el archivo `android/app/src/main/AndroidManifest.xml` debe incluir:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Permisos de Red y Acceso a APIs -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <!-- Permisos de Geolocalizacion Satelital de Alta Precision -->
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
</manifest>
```

### 3.3. Comandos de Compilacion y Despliegue Nativo

1. **Compilar el Frontend Next.js para Exportacion Estatica:**
   ```powershell
   pnpm --filter frontend build
   ```

2. **Sincronizar Recursos Web y Plugins con el Proyecto Android:**
   ```powershell
   cd frontend
   npx cap sync android
   ```

3. **Abrir el Proyecto en Android Studio para Compilacion de APK / Bundle:**
   ```powershell
   npx cap open android
   ```
   En Android Studio: Seleccionar `Build` > `Build Bundle(s) / APK(s)` > `Build APK(s)`.

4. **Ejecucion Directa en Dispositivo Fisico o Emulador:**
   ```powershell
   npx cap run android
   ```

---

## 4. Coexistencia PWA y Empaquetado Hibrido

La plataforma mantiene una arquitectura unificada de cliente:
* **Canal Web PWA:** Si el repartidor o cliente ingresa desde Chrome/Safari en Android/iOS, la aplicacion opera como Progressive Web App con Service Workers y manifiesto web.
* **Canal Nativo Capacitor:** Si se instala el APK generado, la aplicacion corre dentro de un WebView de alto rendimiento con aceleracion por hardware WebGL (MapLibre GL JS) y puente nativo a sensores de geolocalizacion sin recargas de pagina.

---

## Navegacion de Documentacion
* **Anterior:** [01. Infraestructura Local con Docker Compose](./01-infraestructura-docker.md)
* **Siguiente:** [03. Guia Tecnica de CI/CD, Despliegue Automatizado y Rollback](./03-guia-despliegue-devops.md)
* **Indice General:** [README Principal](../../README.md)
