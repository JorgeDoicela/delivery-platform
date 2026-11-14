import { Suspense } from "react";
import { OrderSearchView } from "@/features/tracking";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Mis Pedidos | Seguimiento en Tiempo Real",
  description: "Consulta el estado en tiempo real de tus pedidos en curso, histórico de compras y telemetría satelital de entrega.",
};

export default function PedidosPage() {
  return (
    <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-8 lg:px-12 py-8">
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center min-h-[40vh] text-text-muted gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Cargando tus pedidos...
            </span>
          </div>
        }
      >
        <OrderSearchView />
      </Suspense>
    </div>
  );
}
