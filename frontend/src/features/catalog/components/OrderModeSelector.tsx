"use client";

import React from "react";
import { Bike, Store } from "lucide-react";
import { useCartStore } from "@/features/cart";

export function OrderModeSelector() {
  const deliveryType = useCartStore((s) => s.deliveryType);
  const setDeliveryType = useCartStore((s) => s.setDeliveryType);

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
        <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wide text-neutral-900 font-display">
          ¿Cómo te gustaría ordenar hoy?
        </h2>

        {/* Grid de 2 Tarjetas Principales estilo KFC (Rojo Fast Food) */}
        <div className="grid grid-cols-2 gap-4 sm:gap-5 w-full">
          {/* Opción A Domicilio */}
          <button
            type="button"
            onClick={() => handleSelectMode("delivery")}
            className={`group relative overflow-hidden py-5 px-4 sm:py-6 sm:px-6 rounded-2xl sm:rounded-3xl flex items-center justify-center gap-3.5 sm:gap-5 text-left transition-all active:scale-95 bg-brand-primary hover:bg-brand-primary-hover text-white ${
              deliveryType === "delivery"
                ? "shadow-2xl scale-[1.01]"
                : "shadow-md opacity-90 hover:opacity-100"
            }`}
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 border border-white/20">
              <Bike className="w-7 h-7 sm:w-8 sm:h-8 text-white group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold tracking-wider uppercase text-white/90 block leading-tight">
                La Granjita
              </span>
              <span className="text-base sm:text-xl md:text-2xl font-black uppercase tracking-tight block leading-tight text-white font-display">
                A Domicilio
              </span>
            </div>
          </button>

          {/* Opción Recoge en el Local */}
          <button
            type="button"
            onClick={() => handleSelectMode("takeout")}
            className={`group relative overflow-hidden py-5 px-4 sm:py-6 sm:px-6 rounded-2xl sm:rounded-3xl flex items-center justify-center gap-3.5 sm:gap-5 text-left transition-all active:scale-95 bg-brand-primary hover:bg-brand-primary-hover text-white ${
              deliveryType === "takeout"
                ? "shadow-2xl scale-[1.01]"
                : "shadow-md opacity-90 hover:opacity-100"
            }`}
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 border border-white/20">
              <Store className="w-7 h-7 sm:w-8 sm:h-8 text-white group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold tracking-wider uppercase text-white/90 block leading-tight">
                La Granjita
              </span>
              <span className="text-base sm:text-xl md:text-2xl font-black uppercase tracking-tight block leading-tight text-white font-display">
                Recoge en Local
              </span>
            </div>
          </button>
        </div>

        {/* Píldora de Cupones estilo KFC con el mismo ancho exacto */}
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
            Cupones
          </span>
        </button>
      </div>
    </section>
  );
}
