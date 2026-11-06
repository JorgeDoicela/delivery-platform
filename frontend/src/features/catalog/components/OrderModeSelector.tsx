"use client";

import React from "react";
import { Bike, Store } from "lucide-react";
import { useCartStore } from "@/features/cart";
import { useCurrentTenantQuery } from "@/features/tenant";

export function OrderModeSelector() {
  const deliveryType = useCartStore((s) => s.deliveryType);
  const setDeliveryType = useCartStore((s) => s.setDeliveryType);
  const { data: tenant } = useCurrentTenantQuery();

  const brandName = tenant?.name || "Restaurante";
  const enableDelivery = tenant?.enableDelivery ?? true;
  const enableTakeout = tenant?.enableTakeout ?? true;

  const handleSelectMode = (type: "delivery" | "takeout") => {
    setDeliveryType(type);
    const catalogElement = document.getElementById("catalogo");
    if (catalogElement) {
      catalogElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="w-full text-center py-3">
      <div className="max-w-[760px] mx-auto space-y-4">
        <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wide text-text-strong font-display">
          ¿Cómo te gustaría ordenar hoy?
        </h2>

        <div
          className={`grid gap-3 sm:gap-5 w-full ${
            enableDelivery && enableTakeout ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
          }`}
        >
          {enableDelivery && (
            <button
              type="button"
              onClick={() => handleSelectMode("delivery")}
              className={`group relative overflow-hidden py-4 px-4 sm:py-6 sm:px-6 rounded-2xl sm:rounded-3xl flex items-center justify-center gap-3.5 sm:gap-4 text-left transition-all active:scale-95 bg-brand-primary hover:bg-brand-primary-hover text-white cursor-pointer ${
                deliveryType === "delivery"
                  ? "shadow-2xl scale-[1.01] ring-2 ring-white/40"
                  : "shadow-md hover:shadow-lg"
              }`}
            >
              <Bike className="w-8 h-8 sm:w-10 sm:h-10 text-white shrink-0 group-hover:scale-110 transition-transform" />
              <div className="min-w-0">
                <span className="text-xs sm:text-sm font-bold tracking-wider uppercase text-white/90 block leading-tight truncate">
                  {brandName}
                </span>
                <span className="text-lg sm:text-xl md:text-2xl font-black uppercase tracking-tight block leading-tight text-white font-display">
                  A Domicilio
                </span>
              </div>
            </button>
          )}

          {enableTakeout && (
            <button
              type="button"
              onClick={() => handleSelectMode("takeout")}
              className={`group relative overflow-hidden py-4 px-4 sm:py-6 sm:px-6 rounded-2xl sm:rounded-3xl flex items-center justify-center gap-3.5 sm:gap-4 text-left transition-all active:scale-95 bg-brand-primary hover:bg-brand-primary-hover text-white cursor-pointer ${
                deliveryType === "takeout"
                  ? "shadow-2xl scale-[1.01] ring-2 ring-white/40"
                  : "shadow-md hover:shadow-lg"
              }`}
            >
              <Store className="w-8 h-8 sm:w-10 sm:h-10 text-white shrink-0 group-hover:scale-110 transition-transform" />
              <div className="min-w-0">
                <span className="text-xs sm:text-sm font-bold tracking-wider uppercase text-white/90 block leading-tight truncate">
                  {brandName}
                </span>
                <span className="text-lg sm:text-xl md:text-2xl font-black uppercase tracking-tight block leading-tight text-white font-display">
                  Recoge en Local
                </span>
              </div>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            const catalog = document.getElementById("catalogo");
            if (catalog) catalog.scrollIntoView({ behavior: "smooth" });
          }}
          className="w-full flex items-center justify-center gap-2.5 bg-white hover:bg-neutral-50 border border-neutral-300 py-3 px-6 rounded-full shadow-sm text-sm transition-all active:scale-98"
        >
          <span className="w-5 h-5 rounded-full bg-brand-primary text-white flex items-center justify-center text-xs font-black">
            %
          </span>
          <span className="uppercase tracking-wider font-black text-brand-primary text-xs sm:text-sm">
            Promociones Especiales de {brandName}
          </span>
        </button>
      </div>
    </section>
  );
}
