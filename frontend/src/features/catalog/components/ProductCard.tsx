"use client";

import { useState } from "react";
import Image from "next/image";
import type { MenuProductDto } from "@/shared/types/api";
import { formatCurrency } from "@/shared/lib/utils";
import { ModifierModal } from "./ModifierModal";
import { Plus } from "lucide-react";

interface ProductCardProps {
  product: MenuProductDto;
}

export function ProductCard({ product }: ProductCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fallback seguro a imagen de producto por defecto si no viene definida
  const displayImage = product.imageUrl || "/images/shared/placeholders/dish-default.webp";

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsModalOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsModalOpen(true);
          }
        }}
        aria-label={`Ver detalles y ordenar ${product.name}`}
        className="group relative flex flex-col justify-between bg-surface-card rounded-3xl border border-surface-border overflow-hidden shadow-xs hover:shadow-xl hover:border-brand-primary/40 transition-all duration-300 cursor-pointer text-left focus:outline-hidden focus:ring-2 focus:ring-brand-primary"
      >
        <div>
          {/* Cabecera con Fotografía Gastronómica */}
          <div className="relative w-full aspect-[16/10] bg-surface-canvas overflow-hidden">
            <Image
              src={displayImage}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-30 group-hover:opacity-15 transition-opacity" />

            {/* Badge sutil superior solo si es personalizable */}
            {product.modifierGroups.length > 0 && (
              <div className="absolute top-3 right-3 z-10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full shadow-xs">
                  Personalizable
                </span>
              </div>
            )}
          </div>

          {/* Información del Producto */}
          <div className="p-5 sm:p-6 space-y-2">
            <h3 className="text-lg sm:text-xl font-black text-text-strong group-hover:text-brand-primary transition-colors uppercase tracking-tight leading-tight font-display">
              {product.name}
            </h3>

            <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          </div>
        </div>

        {/* Fila Inferior de Precio y Botón Pedir */}
        <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-3 border-t border-surface-border flex items-center justify-between mt-auto">
          <span className="text-xl sm:text-2xl font-black text-text-strong tracking-tight tabular-nums font-mono">
            {formatCurrency(product.basePrice)}
          </span>

          <span className="inline-flex items-center gap-1.5 bg-brand-primary group-hover:bg-brand-primary-hover text-white text-xs font-black uppercase tracking-wider py-2.5 px-5 rounded-full shadow-sm transition-all group-hover:scale-105 active:scale-95">
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Pedir</span>
          </span>
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
