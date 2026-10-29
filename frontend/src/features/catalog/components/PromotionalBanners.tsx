"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Flame, Sparkles } from "lucide-react";

export function PromotionalBanners() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
      {/* Tarjeta Promocional 1: Celeste/Cian estilo KFC "Sonrisas / Calidad" */}
      <div className="relative overflow-hidden rounded-3xl bg-sky-100 border border-sky-200 p-8 flex flex-col justify-between text-slate-900 shadow-sm min-h-[260px] group">
        <div className="space-y-3 relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 bg-sky-200 text-sky-900 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-sky-800" />
            Receta Tradicional
          </div>
          <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-wide leading-tight text-slate-900">
            24 Horas de Marinado a Fuego Lento
          </h3>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            Nuestra receta tradicional combina especias frescas, ajo asado y limón con cocción lenta sobre leña y carbón vegetal.
          </p>
        </div>

        <div className="pt-6 relative z-10">
          <Link
            href="/catalogo"
            className="inline-flex items-center gap-2 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-full transition-all shadow-md active:scale-95"
          >
            <span>Conoce Más</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Tarjeta Promocional 2: Rojo Puro estilo KFC "Hecho a Mano" */}
      <div className="relative overflow-hidden rounded-3xl bg-brand-primary text-white p-8 flex flex-col justify-between shadow-md min-h-[260px] group">
        <div className="space-y-3 relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 bg-white/20 text-white px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border border-white/25">
            <Flame className="w-3.5 h-3.5 text-amber-300" />
            Sabor Auténtico
          </div>
          <h3 className="text-3xl sm:text-4xl font-black uppercase tracking-wide leading-tight text-white">
            HECHO A LA BRASA
          </h3>
          <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
            Cada pollo se asa al momento en nuestros hornos ecológicos de alta temperatura para garantizar piel crujiente y carne jugosa.
          </p>
        </div>

        <div className="pt-6 relative z-10">
          <Link
            href="/catalogo"
            className="inline-flex items-center gap-2 bg-white hover:bg-neutral-100 text-brand-primary text-xs font-black uppercase tracking-wider px-6 py-3 rounded-full transition-all shadow-md active:scale-95"
          >
            <span>Ver Combos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
