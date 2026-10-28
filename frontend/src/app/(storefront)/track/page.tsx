import { OrderSearchView } from "@/features/tracking";

export const metadata = {
  title: "Rastrear Pedido | Delivery Platform",
  description: "Ingresa el código identificador de tu pedido para consultar la ubicación del repartidor en vivo.",
};

export default function TrackOrderSearchPage() {
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
            Tipografía Opción 3 (Rastreo)
          </span>
          <span className="text-text-strong font-medium">
            Titulares: <strong className="font-display uppercase tracking-wider">Antonio</strong> | Cuerpo: Nunito | Precios: Geist Mono
          </span>
        </div>
        <span className="text-[11px] text-text-subtle font-mono hidden md:inline">
          Inspiración: Chipotle (Trade Gothic + Nunito)
        </span>
      </div>

      <OrderSearchView />
    </div>
  );
}
