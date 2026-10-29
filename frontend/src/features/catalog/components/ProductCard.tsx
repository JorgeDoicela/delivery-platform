"use client";

import { useState } from "react";
import type { MenuProductDto } from "@/shared/types/api";
import { formatCurrency } from "@/shared/lib/utils";
import { ModifierModal } from "./ModifierModal";
import { Plus } from "lucide-react";

interface ProductCardProps {
  product: MenuProductDto;
}

export function ProductCard({ product }: ProductCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="group relative flex flex-col justify-between bg-surface-card rounded-2xl border border-surface-border p-5 shadow-sm hover:shadow-md hover:border-neutral-400 transition-all">
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-800 bg-neutral-100 border border-neutral-200 px-2.5 py-0.5 rounded-full">
              {product.category}
            </span>
            {product.modifierGroups.length > 0 && (
              <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                Personalizable
              </span>
            )}
          </div>

          <h3 className="text-base font-bold text-text-strong group-hover:text-brand-primary transition-colors leading-snug">
            {product.name}
          </h3>

          <p className="text-xs text-text-muted mt-1.5 line-clamp-3 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="mt-6 pt-4 border-t border-surface-border-subtle flex items-center justify-between">
          <div>
            <span className="text-[10px] text-text-muted block uppercase font-bold tracking-wider">
              Precio Base
            </span>
            <span className="text-xl font-black text-text-strong tracking-tight tabular-nums font-mono">
              {formatCurrency(product.basePrice)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 bg-brand-primary hover:bg-brand-primary-hover text-text-inverse-strong text-xs font-black uppercase tracking-wider py-2.5 px-6 rounded-full shadow-md shadow-brand-primary/20 transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Pedir</span>
          </button>
        </div>
      </div>

      {isModalOpen && (
        <ModifierModal
          product={product}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}
