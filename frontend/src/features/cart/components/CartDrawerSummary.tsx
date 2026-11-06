"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useCartStore } from "../store/useCartStore";

export function CartDrawerSummary() {
  const router = useRouter();

  const getSubtotal = useCartStore((s) => s.getSubtotal);
  const getDeliveryFee = useCartStore((s) => s.getDeliveryFee);
  const getTotal = useCartStore((s) => s.getTotal);
  const discountAmount = useCartStore((s) => s.discountAmount);
  const deliveryType = useCartStore((s) => s.deliveryType);
  const closeCart = useCartStore((s) => s.closeCart);

  const subtotal = getSubtotal();
  const deliveryFee = getDeliveryFee();
  const total = getTotal();

  const handleCheckout = () => {
    closeCart();
    router.push("/finalizar-pedido");
  };

  return (
    <div className="pt-2 space-y-4">
      {/* Desglose de totales */}
      <div className="space-y-2 text-xs sm:text-sm text-text-muted">
        <div className="flex items-center justify-between">
          <span>Subtotal:</span>
          <span className="font-mono font-bold text-text-strong tabular-nums">
            ${subtotal.toFixed(2)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span>{deliveryType === "delivery" ? "Envío estimado:" : "Retiro en local:"}</span>
          <span className="font-mono font-bold text-text-strong tabular-nums">
            {deliveryFee > 0 ? `$${deliveryFee.toFixed(2)}` : "Gratis"}
          </span>
        </div>

        {discountAmount > 0 && (
          <div className="flex items-center justify-between text-brand-primary font-semibold">
            <span>Descuento aplicado:</span>
            <span className="font-mono font-bold tabular-nums">
              -${discountAmount.toFixed(2)}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2.5 border-t border-surface-border text-base font-black text-text-strong font-display uppercase tracking-wide">
          <span>Total del pedido:</span>
          <span className="font-mono font-black text-xl text-text-strong tabular-nums">
            ${total.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Botón Sticky Ir a Pagar */}
      <div className="pt-1">
        <button
          type="button"
          onClick={handleCheckout}
          className="w-full h-13 sm:h-14 py-4 px-6 rounded-full bg-brand-primary hover:bg-brand-primary-hover text-white flex items-center justify-between font-display font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg hover:shadow-xl transition-all active:scale-[0.98] cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span>Ir a pagar</span>
            <ArrowRight className="w-4 h-4" />
          </div>
          <span className="font-mono text-base sm:text-lg font-black tabular-nums">
            ${total.toFixed(2)}
          </span>
        </button>
      </div>
    </div>
  );
}
