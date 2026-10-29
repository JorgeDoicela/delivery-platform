import { CheckoutForm } from "@/features/checkout";

export const metadata = {
  title: "Finalizar Pedido | La Granjita Asadero",
  description: "Ingresa tus datos de entrega y método de pago para despacho prioritario desde La Granjita Asadero.",
};

export default function FinalizarPedidoPage() {
  return (
    <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-8 lg:px-12 py-8 space-y-8">
      <div className="border-b border-surface-border pb-4">
        <h1 className="text-3xl sm:text-4xl font-black text-text-strong uppercase tracking-wide font-display">
          Finalizar Pedido
        </h1>
        <p className="text-xs sm:text-sm text-text-muted mt-1 leading-relaxed">
          Ingresa tus datos de entrega y método de pago para despacho prioritario
        </p>
      </div>

      <CheckoutForm />
    </div>
  );
}

