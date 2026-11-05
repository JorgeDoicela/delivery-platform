"use client";

import { useState, useMemo } from "react";
import { useMenuQuery } from "../hooks/useMenuQuery";
import { ProductCard } from "./ProductCard";
import {
  filterProductsBySearch,
  calculateTotalCatalogProducts,
} from "../lib/catalogFilter";
import { AlertTriangle, RefreshCw, Search, X, Utensils } from "lucide-react";

interface CatalogSectionProps {
  tenantSlug?: string;
}

export function CatalogSection({ tenantSlug }: CatalogSectionProps = {}) {
  const { data, isLoading, isError, refetch } = useMenuQuery(false, tenantSlug);
  const [selectedCategory, setSelectedCategory] = useState<string>("TODOS");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const totalProductsCount = useMemo(() => {
    if (!data?.categories) return 0;
    return calculateTotalCatalogProducts(data.categories);
  }, [data]);

  // Filtrado reactivo en tiempo real con normalización de acentos
  const searchResults = useMemo(() => {
    if (!data?.categories || !searchQuery.trim()) return null;
    const all = data.categories.flatMap((c) => c.products);
    return filterProductsBySearch(all, searchQuery);
  }, [data, searchQuery]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-9 w-28 bg-surface-border animate-pulse rounded-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-72 bg-surface-card border border-surface-border rounded-3xl p-5 animate-pulse space-y-4">
              <div className="h-36 w-full bg-surface-canvas rounded-2xl" />
              <div className="h-5 w-3/4 bg-surface-border rounded" />
              <div className="h-4 w-full bg-surface-border rounded" />
              <div className="h-8 w-full bg-surface-border rounded-full mt-4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="bg-surface-card border border-surface-border rounded-3xl p-8 sm:p-12 text-center space-y-4 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-text-strong text-base font-display uppercase tracking-wide">
            No se pudo sincronizar el menú en vivo
          </h3>
          <p className="text-xs text-text-muted max-w-md mx-auto leading-relaxed">
            Verifica que los servicios de catálogo y backend se encuentren activos.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-full transition-all active:scale-95 shadow-sm cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reintentar Conexión</span>
        </button>
      </div>
    );
  }

  const allCategories = [
    { name: "TODOS", count: totalProductsCount },
    ...data.categories.map((c) => ({
      name: c.categoryName,
      count: c.products.length,
    })),
  ];

  return (
    <div className="space-y-8">
      {/* Barra de Control Sticky: Buscador Integrado + Subnav de Categorías */}
      <div className="sticky top-[70px] sm:top-[76px] z-20 bg-surface-canvas/95 backdrop-blur-md pt-2 pb-4 border-b border-surface-border space-y-3.5 transition-all">
        {/* Fila Superior: Buscador Gastronómico en Tiempo Real */}
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-text-muted absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por plato, combo o bebida..."
            className="w-full pl-11 pr-10 py-2.5 rounded-full text-xs sm:text-sm bg-surface-card border border-surface-border focus:border-brand-primary focus:ring-1 focus:ring-brand-primary text-text-strong placeholder:text-text-muted transition-all shadow-2xs outline-hidden"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Limpiar búsqueda"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-text-muted hover:text-text-strong hover:bg-surface-card-hover transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Fila Inferior: Píldoras de Categorías con Contador */}
        {!searchQuery && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {allCategories.map((cat) => {
              const isSelected = selectedCategory === cat.name;

              return (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider font-display transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                    isSelected
                      ? "bg-brand-primary text-white shadow-xs scale-[1.02]"
                      : "bg-surface-card text-text-strong hover:bg-surface-card-hover border border-surface-border hover:border-surface-border-subtle"
                  }`}
                >
                  <span>{cat.name}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-surface-canvas text-text-muted"
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Caso 1: Búsqueda Activa */}
      {searchQuery && searchResults ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm sm:text-base font-bold text-text-strong font-display uppercase tracking-wide">
              Resultados para &ldquo;<span className="text-brand-primary">{searchQuery}</span>&rdquo;
            </h3>
            <span className="text-xs text-text-muted font-mono font-bold">
              {searchResults.length} {searchResults.length === 1 ? "resultado" : "resultados"}
            </span>
          </div>

          {searchResults.length === 0 ? (
            <div className="bg-surface-card border border-surface-border rounded-3xl p-10 sm:p-14 text-center space-y-3">
              <Utensils className="w-8 h-8 text-text-muted mx-auto stroke-1" />
              <p className="text-sm font-bold text-text-strong">
                No encontramos platos que coincidan con &ldquo;{searchQuery}&rdquo;
              </p>
              <p className="text-xs text-text-muted max-w-sm mx-auto">
                Prueba con otro término como &ldquo;pollo&rdquo;, &ldquo;broaster&rdquo;, &ldquo;arroz&rdquo; o &ldquo;cola&rdquo;.
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="mt-2 inline-flex items-center gap-2 bg-surface-canvas hover:bg-surface-card-hover border border-surface-border text-text-strong text-xs font-bold font-display uppercase tracking-wider px-5 py-2.5 rounded-full transition-all"
              >
                Ver Todo el Menú
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
              {searchResults.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      ) : selectedCategory === "TODOS" ? (
        /* Caso 2: Modo TODOS -> Menú Estructurado por Bloques Temáticos */
        <div className="space-y-12">
          {data.categories.map((category) => {
            if (category.products.length === 0) return null;

            return (
              <section key={category.categoryName} className="space-y-5">
                <div className="flex items-center justify-between pb-2 border-b border-surface-border/60">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-xl sm:text-2xl font-black text-text-strong uppercase tracking-tight font-display">
                      {category.categoryName}
                    </h3>
                    <span className="text-xs text-text-muted font-mono font-bold bg-surface-card border border-surface-border px-2 py-0.5 rounded-full">
                      {category.products.length}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
                  {category.products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        /* Caso 3: Categoría Única Seleccionada */
        <div className="space-y-6">
          {(() => {
            const currentCat = data.categories.find(
              (c) => c.categoryName === selectedCategory
            );
            const products = currentCat?.products || [];

            if (products.length === 0) {
              return (
                <div className="bg-surface-card border border-surface-border rounded-2xl p-8 text-center text-text-muted text-xs font-medium">
                  No hay productos disponibles en esta categoría en este momento.
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
