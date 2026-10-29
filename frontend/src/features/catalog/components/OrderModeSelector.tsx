"use client";

import React from "react";
import { Bike, Store, Flame, ShieldCheck } from "lucide-react";
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
          className={`group relative overflow-hidden p-6 sm:p-8 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-5 text-left transition-all active:scale-98 bg-brand-primary hover:bg-brand-primary-hover text-white ${
            deliveryType === "delivery"
              ? "shadow-2xl scale-[1.01]"
              : "shadow-md opacity-90 hover:opacity-100"
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
              Despacho directo y seguro a tu dirección
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
          className={`group relative overflow-hidden p-6 sm:p-8 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-5 text-left transition-all active:scale-98 bg-brand-primary hover:bg-brand-primary-hover text-white ${
            deliveryType === "takeout"
              ? "shadow-2xl scale-[1.01]"
              : "shadow-md opacity-90 hover:opacity-100"
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
              Retiro disponible en todas nuestras sucursales
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
          <Flame className="w-3.5 h-3.5 text-brand-primary" />
          <span>Asado tradicional al carbón</span>
        </div>
        <span className="text-neutral-300 hidden sm:inline">•</span>
        <div className="flex items-center gap-1.5 text-neutral-600">
          <ShieldCheck className="w-3.5 h-3.5 text-status-success" />
          <span>Facturación autorizada SRI</span>
        </div>
      </div>
    </section>
  );
}
