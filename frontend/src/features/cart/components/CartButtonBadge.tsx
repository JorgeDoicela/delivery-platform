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
      className="relative flex items-center justify-center p-1.5 text-neutral-800 hover:text-brand-primary transition-colors group shrink-0"
      aria-label="Ver bolsa de compras"
    >
      <div className="relative">
        <ShoppingBag className="w-6 h-6 text-neutral-900 group-hover:text-brand-primary transition-colors stroke-[1.8]" />
        <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 bg-brand-primary text-white font-black text-[10px] rounded-full flex items-center justify-center shadow-sm leading-none">
          {isClient ? count : 0}
        </span>
      </div>
      {isClient && total > 0 && (
        <span className="font-bold text-xs text-neutral-900 ml-1.5 tabular-nums hidden xl:inline">
          ${total.toFixed(2)}
        </span>
      )}
    </Link>
  );
}
