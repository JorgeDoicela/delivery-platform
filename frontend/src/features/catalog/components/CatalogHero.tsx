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
    ctaHref: "#catalogo",
  },
  {
    badge: "Ahorro Familiar",
    title: "SUPER COMBO ASADOR 12 PRESAS",
    subtitle: "Rinde para 5 a 6 personas. Incluye porción doble de papas fritas rústicas, ensalada grande y gaseosa familiar.",
    highlightPrice: "$24.99",
    ctaText: "PIDE TU COMBO",
    ctaHref: "#catalogo",
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
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-surface-dark via-brand-primary-hover to-brand-primary text-text-inverse-strong shadow-2xl border border-brand-primary/30 p-8 sm:p-12 md:p-16">
      {/* Flechas de Navegación del Carrusel estilo KFC */}
      <button
        type="button"
        onClick={handlePrev}
        aria-label="Anterior promoción"
        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-surface-dark/70 hover:bg-surface-dark text-text-inverse-strong flex items-center justify-center transition-all backdrop-blur-sm z-20 border border-surface-dark-border"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        type="button"
        onClick={handleNext}
        aria-label="Siguiente promoción"
        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-surface-dark/70 hover:bg-surface-dark text-text-inverse-strong flex items-center justify-center transition-all backdrop-blur-sm z-20 border border-surface-dark-border"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      <div className="relative z-10 max-w-4xl space-y-6">
        {/* Badge Superior */}
        <div className="inline-flex items-center gap-2 bg-surface-dark/60 text-brand-accent px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md border border-brand-accent/30">
          <span>{slide.badge}</span>
        </div>

        {/* Titular Principal en Barlow Condensed */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight leading-none text-text-inverse-strong drop-shadow-md">
          {slide.title}
        </h1>

        {/* Descripción */}
        <p className="text-text-inverse-muted text-sm sm:text-base leading-relaxed max-w-xl">
          {slide.subtitle}
        </p>

        {/* Precio Destacado e Interacción Primaria estilo KFC */}
        <div className="flex flex-wrap items-center gap-4 pt-2">
          <div className="bg-surface-dark/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-surface-dark-border flex items-baseline gap-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-text-inverse-muted">
              Desde
            </span>
            <span className="text-2xl sm:text-3xl font-black text-brand-accent tabular-nums">
              {slide.highlightPrice}
            </span>
          </div>

          <Link
            href={slide.ctaHref}
            className="inline-flex items-center gap-2 bg-surface-card text-brand-primary hover:bg-brand-primary-light font-black text-sm uppercase tracking-wider px-8 py-4 rounded-full shadow-xl transition-all hover:scale-105 active:scale-95"
          >
            <span>{slide.ctaText}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/checkout"
            className="inline-flex items-center gap-2 bg-surface-dark/50 hover:bg-surface-dark/80 text-text-inverse-strong font-bold text-xs uppercase tracking-wider px-5 py-4 rounded-full border border-surface-card/20 transition-all backdrop-blur-sm"
          >
            <MapPin className="w-4 h-4 text-brand-accent" />
            <span>Verificar Cobertura</span>
          </Link>
        </div>
      </div>

      {/* Paginación por Puntos estilo KFC */}
      <div className="flex items-center justify-center gap-2 pt-6 relative z-10">
        {HERO_SLIDES.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setCurrentSlideIndex(idx)}
            aria-label={`Ir al banner ${idx + 1}`}
            className={`h-2.5 rounded-full transition-all ${
              idx === currentSlideIndex
                ? "w-8 bg-brand-accent"
                : "w-2.5 bg-surface-card/40 hover:bg-surface-card/70"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
