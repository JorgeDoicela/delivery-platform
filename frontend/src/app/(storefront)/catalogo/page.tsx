import { CatalogSection } from "@/features/catalog";

export const metadata = {
  title: "Catálogo y Menú Interactivo",
  description: "Menú interactivo de combos, especialidades y guarniciones con personalización en línea.",
};

export default function CatalogoPage() {
  return (
    <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-8 lg:px-12 py-8 space-y-8">
      <div className="border-b border-surface-border pb-4">
        <h1 className="text-3xl sm:text-4xl font-black text-text-strong uppercase tracking-wide font-display">
          Menú y Combos
        </h1>
        <p className="text-xs sm:text-sm text-text-muted mt-1 leading-relaxed">
          Personaliza tu orden con guarniciones calientes, ensalada fresca y ají artesanal
        </p>
      </div>

      <CatalogSection />
    </div>
  );
}

