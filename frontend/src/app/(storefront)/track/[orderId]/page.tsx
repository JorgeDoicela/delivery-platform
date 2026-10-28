import { Suspense } from 'react';
import { RefreshCw } from 'lucide-react';
import { OrderTrackingView } from '@/features/tracking';

interface OrderTrackingPageProps {
  params: Promise<{ orderId: string }>;
}

export const metadata = {
  title: 'Seguimiento de Pedido | Delivery Platform',
  description: 'Rastreo satelital en tiempo real de tu pedido con mapa vectorial.',
};

async function OrderTrackingLoader({ params }: OrderTrackingPageProps) {
  const { orderId } = await params;
  return <OrderTrackingView orderId={orderId} />;
}

export default function OrderTrackingPage({ params }: OrderTrackingPageProps) {
  return (
    <div className="space-y-6">
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-text-muted">
            <RefreshCw className="h-8 w-8 animate-spin text-brand-accent mb-4" />
            <p className="text-sm font-medium">Inicializando seguimiento...</p>
          </div>
        }
      >
        <OrderTrackingLoader params={params} />
      </Suspense>
    </div>
  );
}
