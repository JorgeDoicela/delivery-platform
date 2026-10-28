"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Flame, Utensils } from "lucide-react";

export function PromotionalBanners() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
      {/* Tarjeta Promocional 1: Artesanal y Brasa */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-surface-dark via-surface-dark-card to-surface-dark border border-surface-dark-border p-8 flex flex-col justify-between text-text-inverse-strong shadow-lg min-h-[260px] group">
        <div className="space-y-3 relative z-10 max-w-md">
          <div className="inline-flex items-center gap-1.5 bg-brand-primary-muted text-brand-accent px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border border-brand-accent/20">
            <Flame className="w-3.5 h-3.5 text-brand-accent" />
            Asado Artesanal
          </div>
          <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-wide leading-tight">
            24 Horas de Marinado a Fuego Lento
          </h3>
          <p className="text-xs sm:text-sm text-text-inverse-muted leading-relaxed">
            Nuestra receta tradicional combina especias frescas, ajo asado y limón con cocción lenta sobre leña y carbón vegetal.
          </p>
        </div>

        <div className="pt-6 relative z-10">
          <Link
            href="#catalogo"
            className="inline-flex items-center gap-2 bg-brand-primary hover:bg-brand-primary-hover text-text-inverse-strong text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-xl transition-all shadow-md active:scale-95"
          >
            <span>Ver Especialidades</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Tarjeta Promocional 2: Combos Familiares Completos */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-primary/90 via-brand-primary to-brand-primary-hover border border-brand-primary/40 p-8 flex flex-col justify-between text-text-inverse-strong shadow-lg min-h-[260px] group">
        <div className="space-y-3 relative z-10 max-w-md">
          <div className="inline-flex items-center gap-1.5 bg-surface-card/20 text-text-inverse-strong px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border border-surface-card/30">
            <Utensils className="w-3.5 h-3.5" />
            Combos con Todo
          </div>
          <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-wide leading-tight">
            Guarniciones Calientes y Ají de la Casa
          </h3>
          <p className="text-xs sm:text-sm text-brand-primary-light leading-relaxed">
            Cada combo familiar incluye papas rústicas crujientes, ensalada fresca de col, consomé tradicional y salsas ilimitadas.
          </p>
        </div>

        <div className="pt-6 relative z-10">
          <Link
            href="#catalogo"
            className="inline-flex items-center gap-2 bg-surface-dark hover:bg-surface-dark-card text-text-inverse-strong text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-xl transition-all shadow-md active:scale-95"
          >
            <span>Elegir Combo Familiar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
