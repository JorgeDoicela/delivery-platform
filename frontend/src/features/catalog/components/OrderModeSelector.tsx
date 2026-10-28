"use client";

import React from "react";
import { Bike, Store, Clock, ShieldCheck } from "lucide-react";
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
    <section className="space-y-6 w-full text-center pt-2">
      <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wide text-neutral-900">
        ¿Cómo te gustaría ordenar hoy?
      </h2>

      {/* Grid de 2 Tarjetas Principales estilo KFC (Rojo Fast Food) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {/* Opción A Domicilio */}
        <button
          type="button"
          onClick={() => handleSelectMode("delivery")}
          className={`group relative overflow-hidden p-6 sm:p-8 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-5 text-left transition-all active:scale-98 shadow-md bg-brand-primary hover:bg-brand-primary-hover text-white ${
            deliveryType === "delivery"
              ? "ring-4 ring-brand-primary/30 shadow-xl"
              : ""
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 border border-white/25">
            <Bike className="w-9 h-9 text-white group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-center sm:text-left">
            <span className="text-[11px] font-bold tracking-widest uppercase text-white/80 block">
              Directo a tu puerta
            </span>
            <span className="text-2xl sm:text-3xl font-black uppercase tracking-tight block leading-tight text-white">
              A Domicilio
            </span>
            <span className="text-xs text-white/80 block mt-0.5">
              Tarifa estándar: $1.50 • Despacho en 20-35 min
            </span>
          </div>
          {deliveryType === "delivery" && (
            <span className="absolute top-3 right-3 text-[10px] font-bold uppercase bg-white text-brand-primary px-2.5 py-0.5 rounded-full shadow-sm">
              Seleccionado
            </span>
          )}
        </button>

        {/* Opción Recoge en el Local */}
        <button
          type="button"
          onClick={() => handleSelectMode("takeout")}
          className={`group relative overflow-hidden p-6 sm:p-8 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-5 text-left transition-all active:scale-98 shadow-md bg-brand-primary hover:bg-brand-primary-hover text-white ${
            deliveryType === "takeout"
              ? "ring-4 ring-brand-primary/30 shadow-xl"
              : ""
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 border border-white/25">
            <Store className="w-9 h-9 text-white group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-center sm:text-left">
            <span className="text-[11px] font-bold tracking-widest uppercase text-white/80 block">
              Sin costo de envío
            </span>
            <span className="text-2xl sm:text-3xl font-black uppercase tracking-tight block leading-tight text-white">
              Recoge en Local
            </span>
            <span className="text-xs text-white/80 block mt-0.5">
              Retiro en La Granjita Norte o Sur • Listo en 20 min
            </span>
          </div>
          {deliveryType === "takeout" && (
            <span className="absolute top-3 right-3 text-[10px] font-bold uppercase bg-white text-brand-primary px-2.5 py-0.5 rounded-full shadow-sm">
              Seleccionado
            </span>
          )}
        </button>
      </div>

      {/* Píldora de Utilidad y Cupones estilo KFC */}
      <div className="inline-flex flex-wrap items-center justify-center gap-3 bg-white border border-neutral-300 py-2.5 px-6 rounded-full shadow-sm text-xs text-neutral-800">
        <div className="flex items-center gap-1.5 font-bold text-brand-primary">
          <span className="w-4 h-4 rounded-full bg-brand-primary text-white flex items-center justify-center text-[10px] font-black">
            %
          </span>
          <span className="uppercase tracking-wider">Cupones y Descuentos</span>
        </div>
        <span className="text-neutral-300 hidden sm:inline">•</span>
        <div className="flex items-center gap-1.5 text-neutral-600">
          <Clock className="w-3.5 h-3.5 text-brand-primary" />
          <span>Horno en marcha: 20 min por tanda</span>
        </div>
        <span className="text-neutral-300 hidden sm:inline">•</span>
        <div className="flex items-center gap-1.5 text-neutral-600">
          <ShieldCheck className="w-3.5 h-3.5 text-status-success" />
          <span>Envío estándar $1.50 • Facturación SRI</span>
        </div>
      </div>
    </section>
  );
}
