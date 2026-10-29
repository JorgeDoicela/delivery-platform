import {
  CatalogHero,
  OrderModeSelector,
  PromotionalBanners,
  CatalogSection,
} from "@/features/catalog";

export const metadata = {
  title: "La Granjita Asadero | Pedidos Directos y Delivery",
  description: "Pollo asado al carbón y combos familiares directos a tu domicilio desde La Granjita Asadero.",
};

export default function StorefrontHomePage() {
  return (
    <div className="w-full pb-12 space-y-12">
      {/* 1. Gran Banner Panorámico Promocional (Estilo Hero KFC a Ancho Completo) */}
      <CatalogHero />

      {/* Contenedor a ancho completo para el resto de secciones */}
      <div className="w-full px-4 sm:px-8 lg:px-12 space-y-12">
        {/* 2. Selector Principal: ¿Cómo te gustaría ordenar hoy? (Estilo Bloques Rojos KFC) */}
        <OrderModeSelector />

        {/* 3. Tarjetas Promocionales de Especialidad y Receta (Estilo Tarjetas Inferiores KFC) */}
        <PromotionalBanners />

        {/* 4. Menú y Combos Interactivo en Vivo */}
        <section id="catalogo" className="space-y-6 pt-6">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <div>
              <h2 className="text-3xl sm:text-4xl font-black text-text-strong uppercase tracking-wide">
                Menú y Combos
              </h2>
              <p className="text-xs sm:text-sm text-text-muted mt-0.5">
                Personaliza tu orden con guarniciones calientes, ensalada fresca y ají artesanal
              </p>
            </div>
          </div>

          <CatalogSection />
        </section>
      </div>
    </div>
  );
}
