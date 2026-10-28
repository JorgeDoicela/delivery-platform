import { CheckoutForm } from "@/features/checkout";

export const metadata = {
  title: "Finalizar Pedido | Delivery Platform",
  description: "Ingresa tus datos de entrega y método de pago sin intermediarios.",
};

export default function CheckoutPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Finalizar Pedido
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Ingresa tus datos de entrega y método de pago sin fricción
        </p>
      </div>

      <CheckoutForm />
    </div>
  );
}
