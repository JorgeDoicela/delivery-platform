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

  // Fallback seguro a imagen de asadero si no viene definida
  const displayImage = product.imageUrl || "/images/banners/hero-pollo-brasa.jpg";

  return (
    <>
      <div className="group relative flex flex-col justify-between bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-neutral-300 transition-all duration-300">
        <div>
          {/* Cabecera con Fotografía Gastronómica */}
          <div className="relative w-full aspect-[16/10] sm:aspect-[4/3] bg-neutral-100 overflow-hidden">
            <Image
              src={displayImage}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
            />
            {/* Gradiente sutil inferior para contraste */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40 group-hover:opacity-20 transition-opacity" />

            {/* Badges superiores flotantes */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-900 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full shadow-sm">
                {product.category}
              </span>
              {product.modifierGroups.length > 0 && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-black/65 backdrop-blur-md px-2.5 py-1 rounded-full shadow-sm">
                  Personalizable
                </span>
              )}
            </div>
          </div>

          {/* Información del Producto */}
          <div className="p-5 sm:p-6 space-y-2">
            <h3 className="text-xl font-black text-neutral-900 group-hover:text-brand-primary transition-colors uppercase tracking-tight leading-tight font-display">
              {product.name}
            </h3>

            <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          </div>
        </div>

        {/* Fila Inferior de Precio y Botón Pedir */}
        <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-3 border-t border-neutral-100 flex items-center justify-between mt-auto">
          <div>
            <span className="text-[10px] text-neutral-600 block uppercase font-bold tracking-wider">
              Precio Base
            </span>
            <span className="text-2xl font-black text-neutral-950 tracking-tight tabular-nums font-mono">
              {formatCurrency(product.basePrice)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-black uppercase tracking-wider py-3 px-6 rounded-full shadow-md transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
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
