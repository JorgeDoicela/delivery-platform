import { CatalogHero, CatalogSection } from "@/features/catalog";

export const metadata = {
  title: "Delivery Platform | Pedidos Directos y Reparto",
  description: "Pollo asado al carbón y combos familiares directos a tu domicilio.",
};

export default function StorefrontHomePage() {
  return (
    <div
      className="space-y-12"
      style={
        {
          "--font-display-current": "var(--font-barlow-condensed)",
          "--font-sans-current": "var(--font-inter)",
        } as React.CSSProperties
      }
    >
      {/* Banner de Previsualización Tipográfica */}
      <div className="bg-surface-card border border-surface-border rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-text-muted">
        <div>
          <span className="font-bold text-brand-primary uppercase mr-2 tracking-wider text-[11px]">
            Tipografía Opción 1 (Home)
          </span>
          <span className="text-text-strong font-medium">
            Titulares: <strong className="font-display uppercase tracking-wide">Barlow Condensed</strong> | Cuerpo: Inter | Precios: Geist Mono
          </span>
        </div>
        <span className="text-[11px] text-text-subtle font-mono hidden md:inline">
          Inspiración: Asadero Tradicional / Fuego
        </span>
      </div>

      {/* Hero Comercial Operativo */}
      <CatalogHero />

      {/* Sección del Menú Interactivo en Vivo */}
      <section id="catalogo" className="space-y-6 pt-4">
        <div className="flex items-center justify-between pb-2 border-b border-surface-border">
          <div>
            <h2 className="text-3xl font-black text-text-strong uppercase tracking-wide">
              Menú y Combos
            </h2>
            <p className="text-xs text-text-muted">
              Personaliza tu orden con guarniciones y salsas artesanales
            </p>
          </div>
        </div>

        <CatalogSection />
      </section>
    </div>
  );
}
