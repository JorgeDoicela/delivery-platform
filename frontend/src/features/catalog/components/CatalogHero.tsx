"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, MapPin } from "lucide-react";

interface HeroSlide {
  badge: string;
  title: string;
  subtitle: string;
  highlightPrice: string;
  ctaText: string;
  ctaHref: string;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    badge: "Especial del Asador",
    title: "LO QUE TE FALTA ES BRASA Y LEÑA",
    subtitle: "Pollo entero asado lentamente al carbón vegetal con guarniciones calientes, ensalada fresca y ají artesanal.",
    highlightPrice: "$18.99",
    ctaText: "ORDENA AQUÍ",
    ctaHref: "/catalogo",
  },
  {
    badge: "Ahorro Familiar",
    title: "SUPER COMBO ASADOR 12 PRESAS",
    subtitle: "Rinde para 5 a 6 personas. Incluye porción doble de papas fritas rústicas, ensalada grande y gaseosa familiar.",
    highlightPrice: "$24.99",
    ctaText: "ORDENA AQUÍ",
    ctaHref: "/catalogo",
  },
];

export function CatalogHero() {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const slide = HERO_SLIDES[currentSlideIndex];

  const handlePrev = () => {
    setCurrentSlideIndex((prev) => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentSlideIndex((prev) => (prev === HERO_SLIDES.length - 1 ? 0 : prev + 1));
  };

  return (
    <section className="relative overflow-hidden w-full bg-gradient-to-r from-[#e4002b] via-[#d6001c] to-[#b30018] text-white shadow-md py-12 sm:py-16 md:py-20 px-6 sm:px-12 md:px-16">
      {/* Flechas de Navegación del Carrusel estilo KFC */}
      <button
        type="button"
        onClick={handlePrev}
        aria-label="Anterior promoción"
        className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/20 hover:bg-black/35 text-white flex items-center justify-center transition-all backdrop-blur-sm z-20 border border-white/20"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        type="button"
        onClick={handleNext}
        aria-label="Siguiente promoción"
        className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/20 hover:bg-black/35 text-white flex items-center justify-center transition-all backdrop-blur-sm z-20 border border-white/20"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      <div className="relative z-10 w-full space-y-6">
        {/* Badge Superior */}
        <div className="inline-flex items-center gap-2 bg-black/25 text-white px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md border border-white/20">
          <span>{slide.badge}</span>
        </div>

        {/* Titular Principal en Barlow Condensed */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight leading-none text-white drop-shadow-sm">
          {slide.title}
        </h1>

        {/* Descripción */}
        <p className="text-white/90 text-sm sm:text-base leading-relaxed font-medium">
          {slide.subtitle}
        </p>

        {/* Precio Destacado e Interacción Primaria estilo KFC */}
        <div className="flex flex-wrap items-center gap-4 pt-3">
          <div className="bg-black/30 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/20 flex items-baseline gap-2 text-white">
            <span className="text-[11px] font-bold uppercase tracking-widest text-white/80">
              Desde
            </span>
            <span className="text-2xl sm:text-3xl font-black text-amber-300 tabular-nums">
              {slide.highlightPrice}
            </span>
          </div>

          <Link
            href={slide.ctaHref}
            className="inline-flex items-center gap-2 bg-white text-brand-primary hover:bg-neutral-100 font-black text-sm uppercase tracking-wider px-9 py-4 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95"
          >
            <span>{slide.ctaText}</span>
            <ArrowRight className="w-4 h-4 text-brand-primary" />
          </Link>

          <Link
            href="/finalizar-pedido"
            className="inline-flex items-center gap-2 bg-black/25 hover:bg-black/40 text-white font-bold text-xs uppercase tracking-wider px-6 py-4 rounded-full border border-white/25 transition-all backdrop-blur-sm"
          >
            <MapPin className="w-4 h-4 text-amber-300" />
            <span>Verificar Cobertura</span>
          </Link>
        </div>
      </div>

      {/* Paginación por Puntos estilo KFC */}
      <div className="flex items-center justify-center gap-2 pt-8 relative z-10">
        {HERO_SLIDES.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setCurrentSlideIndex(idx)}
            aria-label={`Ir al banner ${idx + 1}`}
            className={`h-2.5 rounded-full transition-all ${
              idx === currentSlideIndex
                ? "w-8 bg-white"
                : "w-2.5 bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
