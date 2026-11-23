"use client";

import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { useCartStore } from "../store/useCartStore";

const emptySubscribe = () => () => {};

export function CartButtonBadge() {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const pathname = usePathname();
  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.getTotal());
  const openCart = useCartStore((s) => s.openCart);
  const isCartOpen = useCartStore((s) => s.isCartOpen);

  const count = items.reduce((acc, i) => acc + i.quantity, 0);
  const isCartActive =
    Boolean(isCartOpen) ||
    Boolean(pathname?.includes("/checkout")) ||
    Boolean(pathname?.includes("/finalizar-pedido"));

  return (
    <button
      type="button"
      onClick={openCart}
      className={`relative flex items-center justify-center p-1.5 transition-colors group shrink-0 cursor-pointer ${
        isCartActive
          ? "text-brand-primary"
          : "text-text-strong hover:text-brand-primary"
      }`}
      aria-label={`Ver carrito de compras, ${isClient ? count : 0} productos`}
    >
      <div className="relative">
        <ShoppingBag
          className={`w-6 h-6 transition-colors stroke-[1.8] ${
            isCartActive
              ? "text-brand-primary"
              : "text-text-strong group-hover:text-brand-primary"
          }`}
        />
        <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 bg-brand-primary text-white font-black text-[10px] rounded-full flex items-center justify-center shadow-sm leading-none">
          {isClient ? count : 0}
        </span>
      </div>
      {isClient && total > 0 && (
        <span
          className={`font-bold text-xs ml-1.5 tabular-nums hidden xl:inline transition-colors ${
            isCartActive ? "text-brand-primary" : "text-text-strong"
          }`}
        >
          ${total.toFixed(2)}
        </span>
      )}
    </button>
  );
}
