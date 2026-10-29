"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight, MapPin } from "lucide-react";

interface HeroSlide {
  badge: string;
  title: string;
  subtitle: string;
  highlightPrice: string;
  ctaText: string;
  ctaHref: string;
  imageUrl: string;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    badge: "Especial del Asador",
    title: "LO QUE TE FALTA ES BRASA Y LEÑA",
    subtitle: "Pollo entero asado lentamente al carbón vegetal con guarniciones calientes, ensalada fresca y ají artesanal.",
    highlightPrice: "$18.99",
    ctaText: "ORDENA AQUÍ",
    ctaHref: "/catalogo",
    imageUrl: "/images/banners/hero-pollo-brasa.jpg",
  },
  {
    badge: "Ahorro Familiar",
    title: "SUPER COMBO ASADOR 12 PRESAS",
    subtitle: "Rinde para 5 a 6 personas. Incluye porción doble de papas fritas rústicas, ensalada grande y gaseosa familiar.",
    highlightPrice: "$24.99",
    ctaText: "ORDENA AQUÍ",
    ctaHref: "/catalogo",
    imageUrl: "/images/banners/hero-combo-familiar.jpg",
  },
  {
    badge: "Favorito del Almuerzo",
    title: "COMBO CUARTO DE POLLO CLÁSICO",
    subtitle: "Presa dorada y jugosa con papas fritas rústicas artesanales, ensalada fresca, ají criollo y bebida personal.",
    highlightPrice: "$5.99",
    ctaText: "ORDENA AQUÍ",
    ctaHref: "/catalogo",
    imageUrl: "/images/banners/hero-combo-personal.jpg",
  },
];

export function CatalogHero() {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const handlePrev = useCallback(() => {
    setCurrentSlideIndex((prev) => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    setCurrentSlideIndex((prev) => (prev === HERO_SLIDES.length - 1 ? 0 : prev + 1));
  }, []);

  const handleSelectSlide = (idx: number) => {
    setCurrentSlideIndex(idx);
  };

  // Avance automático con pausa en hover
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      handleNext();
    }, 6500);

    return () => clearInterval(timer);
  }, [isPaused, handleNext]);

  return (
    <section
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative overflow-hidden w-full min-h-[440px] sm:min-h-[480px] md:min-h-[520px] bg-neutral-950 text-white shadow-xl flex items-center py-12 sm:py-16 md:py-20 px-6 sm:px-12 md:px-16 lg:px-20 select-none"
    >
      {/* Capas de Imágenes Panorámicas de Fondo con Transición Suave y Efecto Ken Burns */}
      {HERO_SLIDES.map((s, idx) => {
        const isActive = idx === currentSlideIndex;
        return (
          <div
            key={s.imageUrl}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              isActive ? "opacity-100 z-0" : "opacity-0 pointer-events-none"
            }`}
          >
            <div className={`relative w-full h-full ${isActive ? "animate-hero-kenburns" : ""}`}>
              <Image
                src={s.imageUrl}
                alt={s.title}
                fill
                priority={idx === 0}
                sizes="100vw"
                className="object-cover object-center md:object-right"
              />
            </div>

            {/* Overlay cinematográfico gastronómico: oscurecido para contraste tipográfico */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/75 to-transparent sm:from-black/90 sm:via-black/60 md:to-black/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
          </div>
        );
      })}

      {/* Flechas de Navegación del Carrusel con Microinteracción Fluida */}
      <button
        type="button"
        onClick={handlePrev}
        aria-label="Anterior promoción"
        className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/40 hover:bg-brand-primary text-white flex items-center justify-center transition-all duration-300 backdrop-blur-md z-20 border border-white/20 shadow-xl hover:scale-110 active:scale-90"
      >
        <ChevronLeft className="w-6 h-6 transition-transform group-hover:-translate-x-0.5" />
      </button>

      <button
        type="button"
        onClick={handleNext}
        aria-label="Siguiente promoción"
        className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/40 hover:bg-brand-primary text-white flex items-center justify-center transition-all duration-300 backdrop-blur-md z-20 border border-white/20 shadow-xl hover:scale-110 active:scale-90"
      >
        <ChevronRight className="w-6 h-6 transition-transform group-hover:translate-x-0.5" />
      </button>

      {/* Contenido Informativo y Tipografía con Transición de Disolución Sincronizada 1:1 con la Imagen */}
      <div className="relative z-10 w-full max-w-2xl grid grid-cols-1 grid-rows-1">
        {HERO_SLIDES.map((s, idx) => {
          const isActive = idx === currentSlideIndex;
          return (
            <div
              key={s.imageUrl}
              aria-hidden={!isActive}
              className={`col-start-1 row-start-1 space-y-6 transition-opacity duration-700 ease-in-out ${
                isActive ? "opacity-100 z-10" : "opacity-0 pointer-events-none z-0"
              }`}
            >
              {/* Badge Superior */}
              <div className="inline-flex items-center gap-2 bg-brand-primary text-white px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-md">
                <span>{s.badge}</span>
              </div>

              {/* Titular Principal en Barlow Condensed */}
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight leading-none text-white drop-shadow-md font-display">
                {s.title}
              </h1>

              {/* Descripción Gastronómica */}
              <p className="text-white/90 text-sm sm:text-base leading-relaxed font-medium drop-shadow">
                {s.subtitle}
              </p>

              {/* Precio Destacado e Interacción Primaria estilo KFC */}
              <div className="flex flex-wrap items-center gap-4 pt-3">
                <div className="bg-black/50 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/20 flex items-baseline gap-2 text-white shadow-lg">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-white/80">
                    Desde
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-amber-300 tabular-nums">
                    {s.highlightPrice}
                  </span>
                </div>

                <Link
                  href={s.ctaHref}
                  tabIndex={isActive ? 0 : -1}
                  className="inline-flex items-center gap-2 bg-brand-primary hover:bg-brand-primary-hover text-white font-black text-sm uppercase tracking-wider px-9 py-4 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95"
                >
                  <span>{s.ctaText}</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </Link>

                <Link
                  href="/finalizar-pedido"
                  tabIndex={isActive ? 0 : -1}
                  className="inline-flex items-center gap-2 bg-black/40 hover:bg-black/60 text-white font-bold text-xs uppercase tracking-wider px-6 py-4 rounded-full border border-white/25 transition-all backdrop-blur-md shadow-md"
                >
                  <MapPin className="w-4 h-4 text-amber-300" />
                  <span>Verificar Cobertura</span>
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Paginación por Puntos estilo KFC con Expansión Dinámica */}
      <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-2 z-10">
        {HERO_SLIDES.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSelectSlide(idx)}
            aria-label={`Ir al banner ${idx + 1}`}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              idx === currentSlideIndex
                ? "w-8 bg-brand-primary shadow-md"
                : "w-2.5 bg-white/40 hover:bg-white/75"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
