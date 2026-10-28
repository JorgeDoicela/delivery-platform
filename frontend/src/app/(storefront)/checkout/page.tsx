import { CheckoutForm } from "@/features/checkout";

export const metadata = {
  title: "Finalizar Pedido | Delivery Platform",
  description: "Ingresa tus datos de entrega y método de pago sin intermediarios.",
};

export default function CheckoutPage() {
  return (
    <div className="w-full space-y-6">
      <div className="border-b border-surface-border pb-4">
        <h1 className="text-2xl font-black text-text-strong tracking-tight">
          Finalizar Pedido
        </h1>
        <p className="text-xs text-text-muted mt-0.5">
          Ingresa tus datos de entrega y método de pago sin fricción
        </p>
      </div>

      <CheckoutForm />
    </div>
  );
}
