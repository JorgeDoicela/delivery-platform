"use client";

import React, { useEffect, useCallback } from "react";
import { X, Trash2, Store } from "lucide-react";
import { useCartStore } from "../store/useCartStore";
import { useCurrentTenantQuery } from "@/features/tenant";
import { getBranchOperatingStatus } from "@/shared/lib/schedule";
import { ScrollArea } from "@/shared/components";
import { CartEmptyState } from "./CartEmptyState";
import { CartDrawerItem } from "./CartDrawerItem";
import { CartDrawerCoupon } from "./CartDrawerCoupon";
import { CartDrawerUtensils } from "./CartDrawerUtensils";
import { CartDrawerSummary } from "./CartDrawerSummary";

export function CartDrawer() {
  const isCartOpen = useCartStore((s) => s.isCartOpen);
  const closeCart = useCartStore((s) => s.closeCart);
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const branchName = useCartStore((s) => s.branchName);
  const tenantSlug = useCartStore((s) => s.tenantSlug);

  const { data: tenant } = useCurrentTenantQuery(tenantSlug);

  // Obtener sucursal activa y sus horarios reales
  const activeBranch = tenant?.branches?.find(
    (b) => b.name.toLowerCase() === branchName?.toLowerCase()
  ) || tenant?.branches?.[0];

  const openingTime = activeBranch?.openingTime || "10:30";
  const closingTime = activeBranch?.closingTime || "21:30";
  const opStatus = getBranchOperatingStatus(openingTime, closingTime);

  // Cierre mediante tecla Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeCart();
      }
    },
    [closeCart]
  );

  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCartOpen, handleKeyDown]);

  if (!isCartOpen) {
    return null;
  }

  const branchTitle = branchName ? branchName.replace(/^Matriz\s*/i, "").trim() : "Principal";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-drawer-title"
      className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200"
    >
      {/* Backdrop difuminado */}
      <div
        onClick={closeCart}
        className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs transition-opacity"
        aria-hidden="true"
      />

      {/* Panel Deslizante Lateral (Drawer) */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-surface-card border-l border-surface-border shadow-2xl flex flex-col justify-between">
          {/* 1. Cabecera Fija */}
          <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between bg-surface-canvas shrink-0">
            <h2
              id="cart-drawer-title"
              className="font-display font-black text-lg uppercase tracking-wider text-text-strong"
            >
              Carrito
            </h2>

            <button
              type="button"
              onClick={closeCart}
              className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-text-strong hover:bg-surface-card-hover transition-colors cursor-pointer"
              aria-label="Cerrar carrito"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 2. Cuerpo del Carrito */}
          {items.length === 0 ? (
            <CartEmptyState tenantSlug={tenantSlug} />
          ) : (
            <div className="flex-1 min-h-0 flex flex-col">
              {/* Subcabecera de Sucursal y Cupón */}
              <div className="p-6 pb-3 space-y-3 shrink-0">
                <div className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-brand-primary" />
                  <h3 className="font-display font-black text-2xl uppercase tracking-tight text-text-strong">
                    Tu Pedido {branchTitle}
                  </h3>
                </div>

                {/* Módulo de Cupón / Billetera */}
                <CartDrawerCoupon />

                {/* Banner de Horario de Atención */}
                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed flex items-center gap-2.5 ${
                    !opStatus.isOpen
                      ? "bg-brand-primary text-white"
                      : "bg-surface-canvas border border-surface-border text-text-muted"
                  }`}
                >
                  <span className="text-[11px]">
                    {!opStatus.isOpen
                      ? `Arma tu pedido y sé el primero en ordenar cuando abramos. Nuestro horario es ${openingTime} a ${closingTime}.`
                      : `Cocina y despacho activos en tiempo real. Atención en horario continuo hasta las ${closingTime}.`}
                  </span>
                </div>
              </div>

              {/* Área Desplazable de Productos con ScrollArea */}
              <ScrollArea
                className="flex-1 px-6 min-h-0"
                viewportClassName="space-y-1"
                scrollShadows
              >
                <div className="divide-y divide-surface-border">
                  {items.map((item) => (
                    <CartDrawerItem key={item.cartItemId} item={item} />
                  ))}
                </div>

                {/* Botón Vaciar Carrito */}
                <div className="pt-3 pb-2">
                  <button
                    type="button"
                    onClick={clearCart}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-surface-border bg-surface-canvas hover:bg-surface-card-hover text-xs font-semibold text-text-muted hover:text-status-danger transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Vaciar carrito</span>
                  </button>
                </div>

                {/* Sección de Utensilios y Cortesía */}
                <CartDrawerUtensils />
              </ScrollArea>

              {/* 3. Resumen y Botón de Checkout Sticky */}
              <div className="px-6 pb-6 pt-2 border-t border-surface-border bg-surface-canvas shrink-0">
                <CartDrawerSummary />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

