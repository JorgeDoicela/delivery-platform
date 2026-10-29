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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
      <div className="bg-surface-card border border-surface-border rounded-2xl p-8 text-center space-y-3 shadow-sm">
        <AlertTriangle className="w-8 h-8 text-brand-primary mx-auto" />
        <h3 className="font-bold text-text-strong text-sm">
          No se pudo sincronizar el menú en vivo
        </h3>
        <p className="text-xs text-text-muted max-w-md mx-auto">
          Verifica que la API backend esté en ejecución para consultar el catálogo maestro.
        </p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-full transition-all active:scale-95 shadow-sm"
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
              className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap shadow-sm ${
                isSelected
                  ? "bg-brand-primary text-text-inverse-strong shadow-lg scale-105"
                  : "bg-surface-card text-text-base hover:bg-surface-card-hover border border-surface-border hover:border-neutral-400"
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>

      {/* Grid de Productos Adaptado a Ancho Completo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
