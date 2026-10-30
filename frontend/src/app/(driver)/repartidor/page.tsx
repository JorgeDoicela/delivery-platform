import { Suspense } from 'react';
import { RefreshCw } from 'lucide-react';
import { DriverDeliveryView } from '@/features/tracking';

export const metadata = {
  title: 'Repartidor - Hoja de Ruta',
  description: 'Terminal móvil de telemetría y liquidación para repartidores.',
};

export default function RepartidorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-text-inverse-muted">
          <RefreshCw className="h-8 w-8 animate-spin text-brand-primary mb-4" />
          <p className="text-xs">Cargando aplicación de repartidor...</p>
        </div>
      }
    >
      <DriverDeliveryView />
    </Suspense>
  );
}

