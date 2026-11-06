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
          {/* Contenedor Fotográfico con Bordes Redondeados y Espaciado Óptimo */}
          <div className="p-3 sm:p-3.5 pb-0">
            <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden bg-neutral-100 shadow-2xs">
              <Image
                src={displayImage}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
              />
            </div>
          </div>

          {/* Información del Producto */}
          <div className="p-4 sm:p-5 pt-2.5 sm:pt-3 space-y-1.5">
            <h3 className="text-base sm:text-lg font-black text-text-strong group-hover:text-brand-primary transition-colors uppercase tracking-tight leading-snug font-display">
              {product.name}
            </h3>

            <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          </div>
        </div>

        {/* Fila Inferior de Precio y Botón Pedir */}
        <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-1.5 flex items-center justify-between mt-auto">
          <span className="text-lg sm:text-xl font-black text-text-strong tracking-tight tabular-nums font-mono">
            {formatCurrency(product.basePrice)}
          </span>

          <span className="inline-flex items-center gap-1.5 bg-brand-primary group-hover:bg-brand-primary-hover text-white text-xs font-black uppercase tracking-wider py-2 px-4 rounded-full shadow-sm transition-all group-hover:scale-105 active:scale-95">
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
