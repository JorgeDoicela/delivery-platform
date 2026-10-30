import { Suspense } from 'react';
import { RefreshCw } from 'lucide-react';
import { OrderTrackingView } from '@/features/tracking';

interface RastreoDetallePageProps {
  params: Promise<{ orderId: string }>;
}

export const metadata = {
  title: 'Seguimiento de Pedido en Tiempo Real',
  description: 'Rastreo satelital en tiempo real de tu pedido con mapa vectorial.',
};

async function OrderTrackingLoader({ params }: RastreoDetallePageProps) {
  const { orderId } = await params;
  return <OrderTrackingView orderId={orderId} />;
}

export default function RastreoDetallePage({ params }: RastreoDetallePageProps) {
  return (
    <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-8 lg:px-12 py-8 space-y-6">
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-text-muted">
            <RefreshCw className="h-8 w-8 animate-spin text-brand-primary mb-4" />
            <p className="text-sm font-medium">Inicializando seguimiento satelital...</p>
          </div>
        }
      >
        <OrderTrackingLoader params={params} />
      </Suspense>
    </div>
  );
}

