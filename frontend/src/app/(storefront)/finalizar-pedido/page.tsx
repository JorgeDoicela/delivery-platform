import { Suspense } from "react";
import { CheckoutForm } from "@/features/checkout";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Finalizar Pedido | Checkout",
  description: "Ingresa tus datos de entrega y método de pago para despacho prioritario geolocalizado.",
};

export default function FinalizarPedidoPage() {
  return (
    <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-8 lg:px-12 py-5 sm:py-8 space-y-6 sm:space-y-8">
      <h1 className="text-2xl sm:text-4xl font-black text-text-strong uppercase tracking-wide font-display">
        Finalizar Pedido
      </h1>

      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center min-h-[40vh] text-text-muted gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Cargando formulario de checkout...
            </span>
          </div>
        }
      >
        <CheckoutForm />
      </Suspense>
    </div>
  );
}

