"use client";

import { useState } from "react";
import { useMenuQuery } from "../hooks/useMenuQuery";
import { ProductCard } from "./ProductCard";
import { AlertTriangle, RefreshCw } from "lucide-react";

export function CatalogSection() {
  const { data, isLoading, isError, refetch } = useMenuQuery();
  const [selectedCategory, setSelectedCategory] = useState<string>("TODOS");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 w-24 bg-surface-border animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-surface-card border border-surface-border rounded-2xl p-5 animate-pulse space-y-4">
              <div className="h-4 w-16 bg-surface-card-hover rounded" />
              <div className="h-6 w-3/4 bg-surface-card-hover rounded" />
              <div className="h-10 w-full bg-surface-card-hover rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="bg-brand-primary-light/40 border border-brand-primary/30 rounded-2xl p-8 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-brand-primary mx-auto" />
        <h3 className="font-bold text-text-strong text-sm">
          No se pudo sincronizar el menú en vivo
        </h3>
        <p className="text-xs text-text-muted max-w-md mx-auto">
          Verifica que la API backend esté en ejecución para consultar el catálogo maestro.
        </p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 bg-surface-dark text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-surface-dark-hover transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reintentar</span>
        </button>
      </div>
    );
  }

  const allCategories = ["TODOS", ...data.categories.map((c) => c.categoryName)];

  const filteredProducts =
    selectedCategory === "TODOS"
      ? data.categories.flatMap((c) => c.products)
      : data.categories.find((c) => c.categoryName === selectedCategory)?.products || [];

  return (
    <div className="space-y-6">
      {/* Selector de Categorías */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {allCategories.map((category) => {
          const isSelected = selectedCategory === category;

          return (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isSelected
                  ? "bg-brand-primary text-white shadow-md shadow-brand-primary/20"
                  : "bg-surface-card text-text-base hover:bg-surface-card-hover border border-surface-border"
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>

      {/* Grid de Productos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
