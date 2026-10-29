"use client";

import { useCartStore } from "../store/useCartStore";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

export function CartButtonBadge() {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.getTotal());

  const count = items.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <Link
      href="/finalizar-pedido"
      className="relative inline-flex items-center gap-2 bg-neutral-100 hover:bg-neutral-200/80 text-neutral-800 text-xs font-semibold px-4 py-2 rounded-full shadow-sm transition-all active:scale-95 border border-neutral-200/80"
    >
      <div className="relative">
        <ShoppingBag className="w-4 h-4 text-brand-primary" />
        {isClient && count > 0 && (
          <span className="absolute -top-2 -right-2 w-4 h-4 bg-brand-primary text-white font-black text-[10px] rounded-full flex items-center justify-center animate-bounce">
            {count}
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-1.5 leading-tight">
        <span className="text-[11px] text-neutral-500 hidden sm:inline font-medium">Carrito</span>
        <span className="font-black text-brand-primary tabular-nums">
          ${isClient ? total.toFixed(2) : "0.00"}
        </span>
      </div>
    </Link>
  );
}
