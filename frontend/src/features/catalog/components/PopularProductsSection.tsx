"use client";

import Link from "next/link";
import { usePopularProductsQuery } from "../hooks/usePopularProductsQuery";
import { ProductCard } from "./ProductCard";
import { useTenantRoutes } from "@/shared/lib/tenant-routing";
import { ArrowRight, AlertTriangle, RefreshCw } from "lucide-react";

interface PopularProductsSectionProps {
  tenantSlug?: string;
  limit?: number;
}

export function PopularProductsSection({
  tenantSlug,
  limit = 8,
}: PopularProductsSectionProps) {
  const { data: popularProducts, isLoading, isError, refetch } = usePopularProductsQuery(
    limit,
    30,
    tenantSlug
  );
  const routes = useTenantRoutes(tenantSlug);
  const menuUrl = routes.getCatalogHref();

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="h-64 sm:h-80 bg-surface-card border border-surface-border rounded-2xl sm:rounded-3xl p-3 sm:p-5 animate-pulse space-y-3 sm:space-y-4"
            >
              <div className="h-28 sm:h-44 w-full bg-surface-canvas rounded-xl sm:rounded-2xl" />
              <div className="h-4 sm:h-5 w-3/4 bg-surface-border rounded" />
              <div className="h-3 sm:h-4 w-full bg-surface-border rounded" />
              <div className="h-7 sm:h-9 w-full bg-surface-border rounded-full mt-2 sm:mt-4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !popularProducts || popularProducts.length === 0) {
    return (
      <div className="bg-surface-card border border-surface-border rounded-3xl p-8 sm:p-12 text-center space-y-4 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-surface-canvas border border-surface-border flex items-center justify-center text-brand-primary mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-text-strong text-base font-display uppercase tracking-wide">
            No se pudieron cargar los platos destacados
          </h3>
          <p className="text-xs text-text-muted max-w-md mx-auto leading-relaxed">
            Verifica la conexión con el servidor gastronómico.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-full transition-all active:scale-95 shadow-sm cursor-pointer font-display"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reintentar</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Cabecera de la Sección: Título enlazado al menú con flecha indicativa */}
      <div className="text-center sm:text-left">
        <Link
          href={menuUrl}
          className="group inline-flex items-center gap-1.5 sm:gap-2.5 text-brand-primary hover:text-brand-primary-hover transition-colors"
          aria-label="Ver todos los platos en el menú completo"
        >
          <h2 className="text-xl sm:text-4xl font-black uppercase tracking-wide font-display">
            Platos Más Populares
          </h2>
          <ArrowRight className="w-5 h-5 sm:w-8 sm:h-8 stroke-[2.5] transition-transform group-hover:translate-x-1 shrink-0" />
        </Link>
      </div>

      {/* Grid de Productos Más Populares: 2 columnas en móvil, 4 en escritorio */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
        {popularProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Botón Ver Menú Completo centrado debajo de los platos */}
      <div className="flex justify-center pt-2 sm:pt-4">
        <Link
          href={menuUrl}
          className="inline-flex items-center gap-2 bg-surface-card hover:bg-surface-card-hover border border-surface-border text-text-strong hover:text-brand-primary text-xs sm:text-sm font-bold uppercase tracking-wider px-6 py-2.5 sm:px-8 sm:py-3.5 rounded-full transition-all duration-200 group shadow-xs hover:shadow-md hover:scale-105 active:scale-95 font-display"
        >
          <span>Ver Menú Completo</span>
          <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
