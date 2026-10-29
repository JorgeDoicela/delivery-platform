"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export function PromotionalBanners() {
  return (
    <section className="w-full py-2">
      <div className="max-w-[1240px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {/* Tarjeta Promocional 1: Celeste/Cian estilo KFC "Sonrisas / Calidad" */}
        <div className="relative overflow-hidden rounded-3xl bg-sky-950 border border-sky-200/30 p-6 sm:p-8 flex flex-col justify-between text-white shadow-lg min-h-[280px] sm:min-h-[320px] group">
          {/* Fotografía Gastronómica de Fondo con Efecto Zoom en Hover */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/images/banners/promo-receta-tradicional.jpg"
              alt="Receta Tradicional La Granjita Asadero"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
            />
            {/* Gradiente cinematográfico para contraste de texto */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-slate-900/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
          </div>

          <div className="space-y-3 relative z-10 max-w-md sm:max-w-lg">
            <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight leading-tight text-white drop-shadow-md font-display">
              24 Horas de Marinado a Fuego Lento
            </h3>
            <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-medium drop-shadow">
              Nuestra receta tradicional combina especias frescas, ajo asado y limón con cocción lenta sobre leña y carbón vegetal.
            </p>
          </div>

          <div className="pt-6 relative z-10">
            <Link
              href="/catalogo"
              className="inline-flex items-center gap-2 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-black uppercase tracking-wider px-6 py-3 rounded-full transition-all shadow-md active:scale-95 hover:scale-105"
            >
              <span>Conoce Más</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Tarjeta Promocional 2: Rojo Puro estilo KFC "Hecho a la Brasa" */}
        <div className="relative overflow-hidden rounded-3xl bg-neutral-950 border border-white/20 p-6 sm:p-8 flex flex-col justify-between text-white shadow-lg min-h-[280px] sm:min-h-[320px] group">
          {/* Fotografía Gastronómica de Fondo con Efecto Zoom en Hover */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/images/banners/promo-hecho-a-la-brasa.jpg"
              alt="Hecho a la Brasa La Granjita Asadero"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
            />
            {/* Gradiente cinematográfico para contraste de texto */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          </div>

          <div className="space-y-3 relative z-10 max-w-md sm:max-w-lg">
            <h3 className="text-3xl sm:text-4xl font-black uppercase tracking-tight leading-tight text-white drop-shadow-md font-display">
              HECHO A LA BRASA
            </h3>
            <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-medium drop-shadow">
              Cada pollo se asa al momento en nuestros hornos ecológicos de alta temperatura para garantizar piel crujiente y carne jugosa.
            </p>
          </div>

          <div className="pt-6 relative z-10">
            <Link
              href="/catalogo"
              className="inline-flex items-center gap-2 bg-white hover:bg-neutral-100 text-brand-primary text-xs font-black uppercase tracking-wider px-6 py-3 rounded-full transition-all shadow-md active:scale-95 hover:scale-105"
            >
              <span>Ver Combos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
