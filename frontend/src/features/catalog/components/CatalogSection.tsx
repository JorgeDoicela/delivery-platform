"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useMenuQuery } from "../hooks/useMenuQuery";
import { ProductCard } from "./ProductCard";
import { filterProductsBySearch } from "../lib/catalogFilter";
import { AlertTriangle, RefreshCw, Search, X, Utensils, LayoutGrid, ChevronDown } from "lucide-react";
import { SelectDropdown } from "@/shared/components";

interface CatalogSectionProps {
  tenantSlug?: string;
}

const POPULAR_SEARCH_SUGGESTIONS = ["Pollo", "Combos", "Bebidas", "Papas", "Alitas"];

export function CatalogSection({ tenantSlug }: CatalogSectionProps = {}) {
  const { data, isLoading, isError, refetch } = useMenuQuery(false, tenantSlug);
  const [selectedCategory, setSelectedCategory] = useState<string>("TODOS");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const pillRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  // Sincronizar y centrar píldora activa en el scroll horizontal ante selecciones vía dropdown
  useEffect(() => {
    const activeEl = pillRefs.current.get(selectedCategory);
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [selectedCategory]);

  // Algoritmo profesional de búsqueda gastronómica: tolerancia tipográfica, multi-token y scoring jerárquico
  const searchResults = useMemo(() => {
    if (!data?.categories || !searchQuery.trim()) return null;
    const all = data.categories.flatMap((c) => c.products);
    return filterProductsBySearch(all, searchQuery);
  }, [data, searchQuery]);

  const allCategories = useMemo(() => {
    if (!data?.categories) return [];
    return [
      { name: "TODOS" },
      ...data.categories.map((c) => ({
        name: c.categoryName,
      })),
    ];
  }, [data]);

  const dropdownOptions = useMemo(() => {
    return allCategories.map((cat) => ({
      value: cat.name,
      label: cat.name === "TODOS" ? "Ver Todo el Menú" : cat.name,
    }));
  }, [allCategories]);


  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-9 w-28 bg-surface-border animate-pulse rounded-full" />
          ))}
        </div>
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

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Barra de Control Sticky: Buscador Integrado + Subnav de Categorías */}
      <div
        style={{ top: "var(--storefront-header-offset, 52px)" }}
        className="sticky z-20 bg-surface-canvas pt-1 sm:pt-2 pb-1.5 sm:pb-2.5 space-y-2 sm:space-y-2.5 transition-[top] duration-300"
      >
        {/* Fila Superior: Buscador Gastronómico en Tiempo Real */}
        <div className="relative w-full max-w-md">
          <Search className="w-3.5 h-3.5 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setSearchQuery("");
            }}
            placeholder="Buscar por plato, combo o bebida..."
            className="w-full pl-9 pr-9 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm bg-surface-card border border-surface-border focus:ring-2 focus:ring-brand-primary text-text-strong placeholder:text-text-muted transition-all outline-hidden"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Limpiar búsqueda"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-text-muted hover:text-text-strong hover:bg-surface-card-hover transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Fila Inferior: En móvil Menú Desplegable Único; en PC Píldoras Directas */}
        {!searchQuery && (
          <div className="w-full">
            {/* Móvil (< sm): Selector Desplegable Único (1 sola línea, sin duplicidad ni desplazamiento horizontal) */}
            <div className="block sm:hidden w-full">
              <SelectDropdown
                options={dropdownOptions}
                value={selectedCategory}
                onChange={(cat) => setSelectedCategory(cat)}
                align="left"
                className="w-full block"
                buttonClassName="w-full !justify-between px-4 py-2"
                menuClassName="w-[calc(100vw-28px)] max-w-none"
                isActive={selectedCategory !== "TODOS"}
                triggerAriaLabel="Seleccionar categoría del menú"
                triggerLabel={
                  <span className="flex items-center justify-between w-full">
                    <span className="flex items-center gap-2">
                      <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-xs uppercase tracking-wide">
                        {selectedCategory === "TODOS"
                          ? "Todas las Categorías"
                          : selectedCategory}
                      </span>
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-70" />
                  </span>
                }
              />
            </div>

            {/* PC / Escritorio (>= sm): Píldoras de Categorías con Scroll Horizontal Fluido */}
            <div className="hidden sm:flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none w-full">
              {allCategories.map((cat) => {
                const isSelected = selectedCategory === cat.name;

                return (
                  <button
                    key={cat.name}
                    ref={(el) => {
                      if (el) {
                        pillRefs.current.set(cat.name, el);
                      } else {
                        pillRefs.current.delete(cat.name);
                      }
                    }}
                    type="button"
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full text-[11px] sm:text-xs font-black uppercase tracking-wider font-display transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                      isSelected
                        ? "bg-brand-primary text-white scale-[1.02]"
                        : "bg-surface-card text-text-strong hover:bg-surface-card-hover border border-surface-border"
                    }`}
                  >
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
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
            <div className="bg-surface-card border border-surface-border rounded-3xl p-8 sm:p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-surface-canvas border border-surface-border flex items-center justify-center text-text-muted mx-auto">
                <Utensils className="w-6 h-6 stroke-1 text-text-muted" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-text-strong">
                  No encontramos platos que coincidan con &ldquo;{searchQuery}&rdquo;
                </p>
                <p className="text-xs text-text-muted max-w-sm mx-auto">
                  Prueba buscando por tipo de comida o selecciona una sugerencia rápida:
                </p>
              </div>

              {/* Sugerencias Rápidas Clickeables */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                {POPULAR_SEARCH_SUGGESTIONS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSearchQuery(tag)}
                    className="px-3 py-1 rounded-full text-xs font-display font-bold uppercase tracking-wider bg-surface-canvas hover:bg-surface-card-hover border border-surface-border text-text-strong transition-all cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold font-display uppercase tracking-wider px-5 py-2.5 rounded-full transition-all cursor-pointer"
                >
                  Ver Todo el Menú
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
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
                <div className="flex items-center justify-center text-center pb-2">
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-brand-primary uppercase tracking-tight font-display">
                    {category.categoryName}
                  </h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
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
                <div className="bg-surface-card border border-surface-border rounded-2xl p-8 text-center text-text-muted text-xs font-medium space-y-3">
                  <p>No hay productos disponibles en esta categoría en este momento.</p>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("TODOS")}
                    className="inline-flex items-center gap-2 bg-surface-canvas hover:bg-surface-card-hover border border-surface-border text-text-strong text-xs font-bold font-display uppercase tracking-wider px-4 py-2 rounded-full transition-all cursor-pointer"
                  >
                    Ver Todo el Menú
                  </button>
                </div>
              );
            }

            return (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row items-center justify-center relative pb-2 text-center">
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-brand-primary uppercase tracking-tight font-display">
                    {currentCat?.categoryName}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("TODOS")}
                    className="sm:absolute sm:right-0 text-xs font-bold text-text-muted hover:text-brand-primary uppercase tracking-wider font-display transition-colors cursor-pointer mt-1 sm:mt-0"
                  >
                    Ver Todo el Menú
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
