"use client";

import { useCartStore } from "@/features/cart/store/useCartStore";
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
      href="/checkout"
      className="relative inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all active:scale-95 border border-slate-700/60"
    >
      <div className="relative">
        <ShoppingBag className="w-4 h-4 text-orange-400" />
        {isClient && count > 0 && (
          <span className="absolute -top-2 -right-2 w-4 h-4 bg-orange-600 text-white font-black text-[10px] rounded-full flex items-center justify-center animate-bounce">
            {count}
          </span>
        )}
      </div>

      <div className="flex flex-col items-start leading-tight">
        <span className="text-[10px] text-slate-400">Ver Carrito</span>
        <span className="font-bold text-orange-400">
          ${isClient ? total.toFixed(2) : "0.00"}
        </span>
      </div>
    </Link>
  );
}
