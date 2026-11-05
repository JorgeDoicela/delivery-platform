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

  return (
    <div className="py-4 border-b border-surface-border flex items-start gap-3.5 transition-colors">
      {/* Thumbnail de producto */}
      <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-surface-canvas border border-surface-border shrink-0">
        <Image
          src={item.imageUrl || "/images/shared/placeholders/food-default.png"}
          alt={item.name}
          fill
          sizes="64px"
          className="object-cover"
        />
      </div>

      {/* Contenido descriptivo */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-display font-black text-sm uppercase tracking-wide text-text-strong truncate">
            {item.name}
          </h4>
          <span className="font-mono font-bold text-sm text-text-strong shrink-0 tabular-nums">
            ${itemTotal.toFixed(2)}
          </span>
        </div>

        {modifiersText && (
          <p className="text-[11px] text-text-muted leading-tight line-clamp-2">
            {modifiersText}
          </p>
        )}

        {/* Acciones y selector de cantidad */}
        <div className="flex items-center justify-between pt-1.5">
          <button
            type="button"
            onClick={() => removeItem(item.cartItemId)}
            className="text-[11px] font-semibold text-text-muted hover:text-status-danger transition-colors cursor-pointer flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            <span>Eliminar</span>
          </button>

          {/* Contador de unidades (-) Qty (+) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => updateQuantity(item.cartItemId, -1)}
              aria-label={`Disminuir cantidad de ${item.name}`}
              className="w-7 h-7 rounded-full border border-surface-border bg-surface-canvas hover:bg-surface-card-hover flex items-center justify-center text-text-strong transition-colors active:scale-90 cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            <span className="font-mono font-bold text-xs text-text-strong min-w-[16px] text-center tabular-nums">
              {item.quantity}
            </span>

            <button
              type="button"
              onClick={() => updateQuantity(item.cartItemId, 1)}
              aria-label={`Aumentar cantidad de ${item.name}`}
              className="w-7 h-7 rounded-full border border-surface-border bg-surface-canvas hover:bg-surface-card-hover flex items-center justify-center text-text-strong transition-colors active:scale-90 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

