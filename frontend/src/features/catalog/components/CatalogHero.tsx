"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { useCurrentTenantQuery } from "@/features/tenant";
import { FALLBACK_TENANT_CONFIGS } from "@/features/tenant/store/useTenantStore";

export function CatalogHero() {
  const { data: tenant } = useCurrentTenantQuery();
  const slides =
    tenant?.heroSlides && tenant.heroSlides.length > 0
      ? tenant.heroSlides
      : FALLBACK_TENANT_CONFIGS["la-granjita"].heroSlides;

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const safeIndex = currentSlideIndex < slides.length ? currentSlideIndex : 0;

  const handlePrev = useCallback(() => {
    setCurrentSlideIndex((prev) =>
      prev <= 0 ? slides.length - 1 : prev - 1
    );
  }, [slides.length]);

  const handleNext = useCallback(() => {
    setCurrentSlideIndex((prev) =>
      prev >= slides.length - 1 ? 0 : prev + 1
    );
  }, [slides.length]);

  const handleSelectSlide = (idx: number) => {
    setCurrentSlideIndex(idx);
  };

  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    const timer = setInterval(() => {
      handleNext();
    }, 6500);

    return () => clearInterval(timer);
  }, [isPaused, handleNext, slides.length]);

  return (
    <section
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative overflow-hidden w-full min-h-[480px] sm:min-h-[530px] md:min-h-[590px] lg:min-h-[610px] bg-neutral-950 text-white shadow-xl flex items-center py-14 sm:py-18 md:py-22 px-6 sm:px-12 md:px-16 lg:px-20 select-none"
    >
      {slides.map((s, idx) => {
        const isActive = idx === safeIndex;
        return (
          <div
            key={`${s.id}-${idx}`}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              isActive ? "opacity-100 z-0" : "opacity-0 pointer-events-none"
            }`}
          >
            <div
              className={`relative w-full h-full ${
                isActive ? "animate-hero-kenburns" : ""
              }`}
            >
              <Image
                src={s.imageUrl || "/images/banners/hero-pollo-brasa.jpg"}
                alt={s.title}
                fill
                priority={idx === 0}
                sizes="100vw"
                className="object-cover object-center md:object-right"
              />
            </div>

            <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/75 to-transparent sm:from-black/90 sm:via-black/60 md:to-black/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
          </div>
        );
      })}

      {slides.length > 1 && (
        <>
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
        </>
      )}

      <div className="relative z-10 w-full max-w-2xl grid grid-cols-1 grid-rows-1">
        {slides.map((s, idx) => {
          const isActive = idx === safeIndex;
          return (
            <div
              key={`${s.id}-content-${idx}`}
              aria-hidden={!isActive}
              className={`col-start-1 row-start-1 space-y-6 transition-opacity duration-700 ease-in-out ${
                isActive ? "opacity-100 z-10" : "opacity-0 pointer-events-none z-0"
              }`}
            >
              <div className="inline-flex items-center gap-2 bg-brand-primary text-white px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-md">
                <span>{s.badge}</span>
              </div>

              <h1 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight leading-none text-white drop-shadow-md font-display">
                {s.title}
              </h1>

              <p className="text-white/90 text-sm sm:text-base leading-relaxed font-medium drop-shadow">
                {s.subtitle}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-3">
                <Link
                  href={s.ctaHref || "/catalogo"}
                  tabIndex={isActive ? 0 : -1}
                  className="inline-flex items-center gap-2 bg-brand-primary hover:bg-brand-primary-hover text-white font-black text-sm uppercase tracking-wider px-9 py-4 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95"
                >
                  <span>{s.ctaText || "ORDENA AQUÍ"}</span>
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

      {slides.length > 1 && (
        <div className="absolute bottom-6 sm:bottom-7 left-0 right-0 flex items-center justify-center gap-2 z-10">
          {slides.map((s, idx) => (
            <button
              key={`${s.id}-dot-${idx}`}
              type="button"
              onClick={() => handleSelectSlide(idx)}
              aria-label={`Ir al banner ${idx + 1}`}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                idx === safeIndex
                  ? "w-8 bg-brand-primary shadow-md"
                  : "w-2.5 bg-white/40 hover:bg-white/75"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
