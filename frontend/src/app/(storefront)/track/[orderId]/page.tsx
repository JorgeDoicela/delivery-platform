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
    <div
      className="space-y-6"
      style={
        {
          "--font-display-current": "var(--font-antonio)",
          "--font-sans-current": "var(--font-nunito)",
        } as React.CSSProperties
      }
    >
      {/* Banner de Previsualización Tipográfica */}
      <div className="bg-surface-card border border-surface-border rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-text-muted">
        <div>
          <span className="font-bold text-brand-primary uppercase mr-2 tracking-wider text-[11px]">
            Tipografía Opción 3 (Tracking en Vivo)
          </span>
          <span className="text-text-strong font-medium">
            Titulares: <strong className="font-display uppercase tracking-wider">Antonio</strong> | Cuerpo: Nunito | Precios: Geist Mono
          </span>
        </div>
        <span className="text-[11px] text-text-subtle font-mono hidden md:inline">
          Inspiración: Chipotle (Trade Gothic + Nunito)
        </span>
      </div>

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
