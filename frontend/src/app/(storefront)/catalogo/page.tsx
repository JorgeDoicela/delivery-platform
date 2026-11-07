import React, { Suspense } from "react";
import { CatalogSection } from "@/features/catalog";
import { Loader2 } from "lucide-react";

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

      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center min-h-[40vh] text-text-muted gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Cargando catálogo...
            </span>
          </div>
        }
      >
        <CatalogSection />
      </Suspense>
    </div>
  );
}

