import { Suspense } from 'react';
import { RefreshCw } from 'lucide-react';
import { DriverDeliveryView } from '@/features/tracking';

export const metadata = {
  title: 'Repartidor - Hoja de Ruta | Delivery Platform',
  description: 'Terminal móvil de telemetría y liquidación para repartidores.',
};

export default function ActiveDeliveryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-neutral-400">
          <RefreshCw className="h-8 w-8 animate-spin text-amber-500 mb-4" />
          <p className="text-xs">Cargando aplicación de repartidor...</p>
        </div>
      }
    >
      <DriverDeliveryView />
    </Suspense>
  );
}
