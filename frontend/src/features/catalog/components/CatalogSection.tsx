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
            <div key={i} className="h-8 w-24 bg-slate-200 animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-white border border-slate-200 rounded-2xl p-5 animate-pulse space-y-4">
              <div className="h-4 w-16 bg-slate-100 rounded" />
              <div className="h-6 w-3/4 bg-slate-100 rounded" />
              <div className="h-10 w-full bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="bg-orange-50/60 border border-orange-200/80 rounded-2xl p-8 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-orange-600 mx-auto" />
        <h3 className="font-bold text-slate-900 text-sm">
          No se pudo sincronizar el menú en vivo
        </h3>
        <p className="text-xs text-slate-600 max-w-md mx-auto">
          Verifica que la API backend esté en ejecución para consultar el catálogo maestro.
        </p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-slate-800 transition-colors"
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
                  ? "bg-orange-600 text-white shadow-md shadow-orange-600/20"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
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
