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
