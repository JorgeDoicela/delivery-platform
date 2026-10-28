import { CatalogHero, CatalogSection } from "@/features/catalog";

export const metadata = {
  title: "Delivery Platform | Pedidos Directos y Reparto",
  description: "Pollo asado al carbón y combos familiares directos a tu domicilio.",
};

export default function StorefrontHomePage() {
  return (
    <div className="space-y-12">
      {/* Hero Comercial Operativo */}
      <CatalogHero />

      {/* Sección del Menú Interactivo en Vivo */}
      <section id="catalogo" className="space-y-6 pt-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Menú y Combos
            </h2>
            <p className="text-xs text-slate-500">
              Personaliza tu orden con guarniciones y salsas artesanales
            </p>
          </div>
        </div>

        <CatalogSection />
      </section>
    </div>
  );
}
