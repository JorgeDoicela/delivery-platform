"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useMenuQuery } from "../hooks/useMenuQuery";
import { ProductCard } from "./ProductCard";
import { getPopularProducts } from "../lib/catalogFilter";
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
  const { data, isLoading, isError, refetch } = useMenuQuery(false, tenantSlug);
  const routes = useTenantRoutes(tenantSlug);

  const popularProducts = useMemo(() => {
    if (!data?.categories) return [];
    return getPopularProducts(data.categories, limit);
  }, [data, limit]);

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

  if (isError || !data) {
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
      {/* Cabecera de la Sección: Centrada y ordenada en móvil, a los extremos en escritorio */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2.5 sm:gap-4 text-center sm:text-left items-center sm:items-start">
        <div className="max-w-xl mx-auto sm:mx-0">
          <h2 className="text-xl sm:text-4xl font-black text-brand-primary uppercase tracking-wide font-display">
            Platos Más Populares
          </h2>
          <p className="text-xs sm:text-sm text-text-strong mt-0.5 sm:mt-1 max-w-xl">
            Nuestras especialidades al carbón y combos más aclamados por los clientes.
          </p>
        </div>

        <Link
          href={menuUrl}
          className="inline-flex items-center gap-1.5 self-center sm:self-auto bg-surface-card hover:bg-surface-card-hover text-text-strong hover:text-brand-primary text-[11px] sm:text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 sm:px-4.5 sm:py-2.5 rounded-full transition-all duration-200 group shrink-0 shadow-xs hover:shadow-md font-display"
        >
          <span>Ver Menú Completo</span>
          <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Grid de Productos Más Populares: 2 columnas en móvil, 4 en escritorio */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
        {popularProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

