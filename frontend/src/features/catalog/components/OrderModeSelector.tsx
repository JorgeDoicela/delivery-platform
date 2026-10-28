"use client";

import React from "react";
import { Bike, Store, Sparkles, Clock, ShieldCheck } from "lucide-react";
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
      <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-wide text-text-strong">
        ¿Cómo te gustaría ordenar hoy?
      </h2>

      {/* Grid de 2 Tarjetas Principales estilo KFC (Ancho Completo) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {/* Opción A Domicilio */}
        <button
          type="button"
          onClick={() => handleSelectMode("delivery")}
          className={`group relative overflow-hidden p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-4 text-left transition-all active:scale-98 shadow-md ${
            deliveryType === "delivery"
              ? "bg-brand-primary text-text-inverse-strong ring-4 ring-brand-primary/20 shadow-lg shadow-brand-primary/30"
              : "bg-brand-primary/95 hover:bg-brand-primary text-text-inverse-strong"
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-surface-card/15 flex items-center justify-center shrink-0 border border-surface-card/20">
            <Bike className="w-8 h-8 text-text-inverse-strong group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-center sm:text-left">
            <span className="text-[11px] font-bold tracking-widest uppercase text-brand-primary-light block">
              Directo a tu puerta
            </span>
            <span className="text-2xl sm:text-3xl font-black uppercase tracking-tight block leading-tight">
              A Domicilio
            </span>
            <span className="text-xs text-text-inverse-muted block mt-0.5">
              Tarifa estándar: $1.50 • Despacho en 20-35 min
            </span>
          </div>
          {deliveryType === "delivery" && (
            <span className="absolute top-2 right-2 text-[10px] font-bold uppercase bg-surface-card text-brand-primary px-2 py-0.5 rounded-full shadow-sm">
              Seleccionado
            </span>
          )}
        </button>

        {/* Opción Recoge en el Local */}
        <button
          type="button"
          onClick={() => handleSelectMode("takeout")}
          className={`group relative overflow-hidden p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-4 text-left transition-all active:scale-98 shadow-md ${
            deliveryType === "takeout"
              ? "bg-brand-primary text-text-inverse-strong ring-4 ring-brand-primary/20 shadow-lg shadow-brand-primary/30"
              : "bg-brand-primary/95 hover:bg-brand-primary text-text-inverse-strong"
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-surface-card/15 flex items-center justify-center shrink-0 border border-surface-card/20">
            <Store className="w-8 h-8 text-text-inverse-strong group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-center sm:text-left">
            <span className="text-[11px] font-bold tracking-widest uppercase text-brand-primary-light block">
              Sin costo de envío
            </span>
            <span className="text-2xl sm:text-3xl font-black uppercase tracking-tight block leading-tight">
              Recoge en Local
            </span>
            <span className="text-xs text-text-inverse-muted block mt-0.5">
              Retiro en Sucursal Norte o Sur
            </span>
          </div>
          {deliveryType === "takeout" && (
            <span className="absolute top-2 right-2 text-[10px] font-bold uppercase bg-surface-card text-brand-primary px-2 py-0.5 rounded-full shadow-sm">
              Seleccionado
            </span>
          )}
        </button>
      </div>

      {/* Barra Píldora de Utilidad estilo KFC Cupones / Horno */}
      <div className="inline-flex flex-wrap items-center justify-center gap-3 bg-surface-card border border-surface-border py-2 px-5 rounded-full shadow-sm text-xs text-text-base">
        <div className="flex items-center gap-1.5 font-bold text-brand-primary">
          <Clock className="w-3.5 h-3.5" />
          <span>Horno en Marcha: 20 min por tanda</span>
        </div>
        <span className="text-surface-border hidden sm:inline">•</span>
        <div className="flex items-center gap-1.5 text-text-muted">
          <ShieldCheck className="w-3.5 h-3.5 text-status-success" />
          <span>Facturación SRI Electrónica</span>
        </div>
        <span className="text-surface-border hidden sm:inline">•</span>
        <div className="flex items-center gap-1.5 text-text-muted">
          <Sparkles className="w-3.5 h-3.5 text-brand-accent" />
          <span>Carbón 100% Vegetal y Leña</span>
        </div>
      </div>
    </section>
  );
}

