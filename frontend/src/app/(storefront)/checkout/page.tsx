import { CheckoutForm } from "@/features/checkout";

export const metadata = {
  title: "Finalizar Pedido | Delivery Platform",
  description: "Ingresa tus datos de entrega y método de pago sin intermediarios.",
};

export default function CheckoutPage() {
  return (
    <div
      className="max-w-6xl mx-auto space-y-6"
      style={
        {
          "--font-display-current": "var(--font-outfit)",
          "--font-sans-current": "var(--font-inter)",
        } as React.CSSProperties
      }
    >
      {/* Banner de Previsualización Tipográfica */}
      <div className="bg-surface-card border border-surface-border rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-text-muted">
        <div>
          <span className="font-bold text-brand-primary uppercase mr-2 tracking-wider text-[11px]">
            Tipografía Opción 2 (Checkout)
          </span>
          <span className="text-text-strong font-medium">
            Titulares: <strong className="font-display">Outfit</strong> | Cuerpo: Inter | Precios: Geist Mono
          </span>
        </div>
        <span className="text-[11px] text-text-subtle font-mono hidden md:inline">
          Inspiración: Fast-Casual Moderno (Shake Shack / Wolt)
        </span>
      </div>

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
