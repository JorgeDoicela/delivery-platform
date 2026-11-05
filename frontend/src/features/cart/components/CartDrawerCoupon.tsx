"use client";

import React, { useState, useId } from "react";
import { Tag, ChevronRight, X, Check } from "lucide-react";
import { useCartStore } from "../store/useCartStore";

export function CartDrawerCoupon() {
  const [isInputOpen, setIsInputOpen] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const couponCode = useCartStore((s) => s.couponCode);
  const discountAmount = useCartStore((s) => s.discountAmount);
  const applyCoupon = useCartStore((s) => s.applyCoupon);
  const removeCoupon = useCartStore((s) => s.removeCoupon);

  const inputId = useId();

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!code.trim()) return;

    const success = applyCoupon(code);
    if (success) {
      setCode("");
      setIsInputOpen(false);
    } else {
      setError("Código no válido o expirado.");
    }
  };

  if (couponCode) {
    return (
      <div className="p-3 rounded-2xl bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-brand-primary text-white flex items-center justify-center">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <div>
            <span className="font-bold text-text-strong font-mono uppercase block">
              {couponCode}
            </span>
            <span className="text-[11px] text-brand-primary font-semibold">
              Descuento aplicado: -${discountAmount.toFixed(2)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={removeCoupon}
          className="text-text-muted hover:text-status-danger p-1 transition-colors cursor-pointer"
          title="Remover código"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {!isInputOpen ? (
        <button
          type="button"
          onClick={() => setIsInputOpen(true)}
          className="w-full px-4 py-2.5 rounded-full bg-neutral-900 text-white dark:bg-neutral-800 flex items-center justify-between text-xs transition-colors hover:bg-neutral-800 dark:hover:bg-neutral-700 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-brand-primary flex items-center justify-center text-white text-[10px] font-bold">
              %
            </div>
            <span className="font-semibold text-[11px] tracking-wide">¿Tienes un código?</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-neutral-300 font-bold font-display uppercase tracking-wider">
            <span>Mi billetera</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </button>
      ) : (
        <form onSubmit={handleApply} className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <label htmlFor={inputId} className="sr-only">
                Código de descuento
              </label>
              <Tag className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id={inputId}
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ingresa cupón (ej. MESAFY10)"
                autoFocus
                className="w-full pl-9 pr-3 py-2 bg-surface-canvas border border-surface-border rounded-full text-xs font-mono uppercase text-text-strong focus:outline-none focus:ring-1 focus:ring-brand-primary"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-brand-primary text-white text-xs font-bold font-display uppercase tracking-wider rounded-full hover:bg-brand-primary-hover transition-colors cursor-pointer"
            >
              Aplicar
            </button>

            <button
              type="button"
              onClick={() => {
                setIsInputOpen(false);
                setError(null);
              }}
              className="p-2 text-text-muted hover:text-text-strong transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {error && (
            <p className="text-[11px] text-status-danger pl-3">{error}</p>
          )}
        </form>
      )}
    </div>
  );
}

