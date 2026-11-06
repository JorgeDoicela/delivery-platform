"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useMenuQuery } from "../hooks/useMenuQuery";
import { ProductCard } from "./ProductCard";
import { getPopularProducts } from "../lib/catalogFilter";
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

  const popularProducts = useMemo(() => {
    if (!data?.categories) return [];
    return getPopularProducts(data.categories, limit);
  }, [data, limit]);

  const menuUrl = tenantSlug ? `/${tenantSlug}/menu` : "/menu";

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="h-80 bg-surface-card border border-surface-border rounded-3xl p-5 animate-pulse space-y-4"
            >
              <div className="h-44 w-full bg-surface-canvas rounded-2xl" />
              <div className="h-5 w-3/4 bg-surface-border rounded" />
              <div className="h-4 w-full bg-surface-border rounded" />
              <div className="h-9 w-full bg-surface-border rounded-full mt-4" />
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
    <div className="space-y-6">
      {/* Cabecera de la Sección según Patrón 4.5 de delivery-estilos */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-brand-primary block mb-1 font-sans">
            Los Más Pedidos &bull; Favoritos del Asador
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-text-strong uppercase tracking-wide font-display">
            Platos Más Populares
          </h2>
          <p className="text-xs sm:text-sm text-text-muted mt-1 max-w-xl">
            Nuestras especialidades al carbón y combos más aclamados por los clientes.
          </p>
        </div>

        <Link
          href={menuUrl}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto bg-surface-card hover:bg-surface-card-hover text-text-strong hover:text-brand-primary text-xs font-bold uppercase tracking-wider px-4.5 py-2.5 rounded-full transition-all duration-200 group shrink-0 shadow-xs hover:shadow-md font-display"
        >
          <span>Ver Menú Completo</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Grid de Productos Más Populares (4 columnas compactas) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {popularProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

