"use client";

import React from "react";
import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import type { CartItem } from "../store/useCartStore";
import { useCartStore } from "../store/useCartStore";

interface CartDrawerItemProps {
  item: CartItem;
}

export function CartDrawerItem({ item }: CartDrawerItemProps) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const modifiersText =
    item.selectedModifiers.length > 0
      ? item.selectedModifiers.map((m) => m.name).join(", ")
      : null;

  const itemTotal = item.itemPrice * item.quantity;
  const displayImage = item.imageUrl || "/images/shared/placeholders/dish-default.webp";

  return (
    <div className="p-4 rounded-2xl bg-surface-canvas/50 border border-surface-border hover:border-surface-border-subtle transition-all duration-200 flex items-start gap-4 shadow-2xs">
      {/* Thumbnail de producto */}
      <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-neutral-100 border border-surface-border shrink-0">
        <Image
          src={displayImage}
          alt={item.name}
          fill
          sizes="80px"
          className="object-cover"
        />
      </div>

      {/* Contenido descriptivo */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-start justify-between gap-3">
          <h4 className="font-display font-black text-sm sm:text-base uppercase tracking-wide text-text-strong leading-snug">
            {item.name}
          </h4>
          <span className="font-mono font-black text-sm sm:text-base text-text-strong shrink-0 tabular-nums">
            ${itemTotal.toFixed(2)}
          </span>
        </div>

        {modifiersText && (
          <p className="text-xs text-text-muted leading-relaxed line-clamp-2">
            {modifiersText}
          </p>
        )}

        {/* Acciones y selector de cantidad */}
        <div className="flex items-center justify-between pt-1.5">
          <button
            type="button"
            onClick={() => removeItem(item.cartItemId)}
            className="text-xs font-semibold text-text-muted hover:text-status-danger transition-colors cursor-pointer flex items-center gap-1.5 active:scale-95"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Eliminar</span>
          </button>

          {/* Stepper de cantidad (-) Qty (+) */}
          <div className="flex items-center gap-1.5 bg-surface-card border border-surface-border rounded-full p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => updateQuantity(item.cartItemId, -1)}
              aria-label={`Disminuir cantidad de ${item.name}`}
              className="w-7 h-7 rounded-full hover:bg-surface-canvas flex items-center justify-center text-text-strong transition-all active:scale-90 cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>

            <span className="font-mono font-black text-xs sm:text-sm text-text-strong min-w-[20px] text-center tabular-nums">
              {item.quantity}
            </span>

            <button
              type="button"
              onClick={() => updateQuantity(item.cartItemId, 1)}
              aria-label={`Aumentar cantidad de ${item.name}`}
              className="w-7 h-7 rounded-full hover:bg-surface-canvas flex items-center justify-center text-text-strong transition-all active:scale-90 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
