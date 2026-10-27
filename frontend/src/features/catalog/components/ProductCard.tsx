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
      <div className="group relative flex flex-col justify-between bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all">
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
              {product.category}
            </span>
            {product.modifierGroups.length > 0 && (
              <span className="text-[10px] text-slate-400 font-medium">
                Personalizable
              </span>
            )}
          </div>

          <h3 className="text-base font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
            {product.name}
          </h3>

          <p className="text-xs text-slate-500 mt-1 line-clamp-3 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-medium">
              Precio Base
            </span>
            <span className="text-lg font-black text-slate-900 tracking-tight">
              {formatCurrency(product.basePrice)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-orange-600 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all active:scale-95"
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
