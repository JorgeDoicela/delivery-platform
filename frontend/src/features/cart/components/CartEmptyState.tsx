"use client";

import React from "react";
import { ShoppingBag, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useCartStore } from "../store/useCartStore";

interface CartEmptyStateProps {
  tenantSlug: string;
}

export function CartEmptyState({ tenantSlug }: CartEmptyStateProps) {
  const closeCart = useCartStore((s) => s.closeCart);
  const catalogHref = tenantSlug ? `/${tenantSlug}/menu` : "/#restaurantes";

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
      <div className="w-16 h-16 rounded-full bg-surface-canvas border border-surface-border flex items-center justify-center text-text-muted">
        <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
      </div>

      <div className="space-y-1 max-w-xs">
        <h3 className="font-display font-black text-xl uppercase tracking-wide text-text-strong">
          Tu carrito está vacío
        </h3>
        <p className="text-xs text-text-muted leading-relaxed">
          Agrega tus especialidades, combos y guarniciones favoritas para iniciar tu pedido.
        </p>
      </div>

      <Link
        href={catalogHref}
        onClick={closeCart}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-black font-display uppercase tracking-wider transition-all active:scale-95 shadow-md"
      >
        <span>Explorar Menú</span>
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

