"use client";

import React from "react";
import { Motorbike, Building2, ArrowRight } from "lucide-react";
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
    <section className="w-full text-center py-1 sm:py-3">
      <div className="max-w-[760px] mx-auto space-y-3 sm:space-y-4">
        <h2 className="text-base sm:text-3xl font-black uppercase tracking-wide text-text-strong font-display">
          ¿Cómo te gustaría ordenar hoy?
        </h2>

        <div
          className={`grid gap-2.5 sm:gap-5 w-full max-w-[330px] xs:max-w-[360px] sm:max-w-none mx-auto ${
            enableDelivery && enableTakeout ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
          }`}
        >
          {enableDelivery && (
            <button
              type="button"
              onClick={() => handleSelectMode("delivery")}
              className={`group relative overflow-hidden py-3.5 px-4.5 sm:py-5 sm:px-6 rounded-2xl sm:rounded-3xl flex items-center justify-between sm:justify-start gap-3.5 sm:gap-4 text-left transition-all active:scale-98 bg-brand-primary hover:bg-brand-primary-hover text-white cursor-pointer ${
                deliveryType === "delivery"
                  ? "shadow-md sm:shadow-xl ring-2 ring-brand-primary/20 scale-[1.01]"
                  : "shadow-xs sm:shadow-md hover:shadow-lg opacity-90 hover:opacity-100"
              }`}
            >
              <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                <Motorbike className="w-6 h-6 sm:w-10 sm:h-10 text-white shrink-0 group-hover:scale-105 transition-transform" />
                <div className="min-w-0">
                  <span className="text-[11px] sm:text-xs font-bold tracking-wider uppercase text-white/85 block leading-tight truncate">
                    {brandName}
                  </span>
                  <span className="text-base sm:text-xl md:text-2xl font-black uppercase tracking-tight block leading-tight text-white font-display">
                    A Domicilio
                  </span>
                </div>
              </div>
              <ArrowRight className="w-4.5 h-4.5 text-white/70 sm:hidden shrink-0" />
            </button>
          )}

          {enableTakeout && (
            <button
              type="button"
              onClick={() => handleSelectMode("takeout")}
              className={`group relative overflow-hidden py-3.5 px-4.5 sm:py-5 sm:px-6 rounded-2xl sm:rounded-3xl flex items-center justify-between sm:justify-start gap-3.5 sm:gap-4 text-left transition-all active:scale-98 bg-brand-primary hover:bg-brand-primary-hover text-white cursor-pointer ${
                deliveryType === "takeout"
                  ? "shadow-md sm:shadow-xl ring-2 ring-brand-primary/20 scale-[1.01]"
                  : "shadow-xs sm:shadow-md hover:shadow-lg opacity-90 hover:opacity-100"
              }`}
            >
              <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                <Building2 className="w-6 h-6 sm:w-10 sm:h-10 text-white shrink-0 group-hover:scale-105 transition-transform" />
                <div className="min-w-0">
                  <span className="text-[11px] sm:text-xs font-bold tracking-wider uppercase text-white/85 block leading-tight truncate">
                    {brandName}
                  </span>
                  <span className="text-base sm:text-xl md:text-2xl font-black uppercase tracking-tight block leading-tight text-white font-display">
                    Recoge en Local
                  </span>
                </div>
              </div>
              <ArrowRight className="w-4.5 h-4.5 text-white/70 sm:hidden shrink-0" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
