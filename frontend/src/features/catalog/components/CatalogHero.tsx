"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useCurrentTenantQuery } from "@/features/tenant";
import { getFallbackTenantConfig } from "@/features/tenant/store/useTenantStore";
import type { TenantStorefrontConfigDto } from "@/shared/types/api";

interface CatalogHeroProps {
  tenant?: TenantStorefrontConfigDto | null;
}

export function CatalogHero({ tenant: tenantProp }: CatalogHeroProps = {}) {
  const { data: queryTenant } = useCurrentTenantQuery();
  const tenant = tenantProp ?? queryTenant;
  const slides =
    tenant?.heroSlides && tenant.heroSlides.length > 0
      ? tenant.heroSlides
      : getFallbackTenantConfig(tenant?.slug || "la-granjita").heroSlides;

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
      className="relative overflow-hidden w-full min-h-[440px] sm:min-h-[520px] md:min-h-[580px] lg:min-h-[610px] bg-neutral-950 text-white shadow-xl flex items-center py-10 sm:py-16 md:py-20 px-4 sm:px-8 md:px-14 lg:px-20 select-none"
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
                src={s.imageUrl || "/images/tenants/la-granjita/banners/hero-pollo-brasa.jpg"}
                alt={s.title}
                fill
                loading={idx === 0 ? "eager" : "lazy"}
                sizes="100vw"
                className="object-cover object-center md:object-right"
              />
            </div>

            {/* Gradiente Cinematográfico Suave que Resalta la Comida */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent sm:from-black/80 sm:via-black/35 sm:to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>
        );
      })}

      {/* Flechas de Navegación Discretas y Elegantes */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Anterior promoción"
            className="absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/30 hover:bg-black/60 text-white/90 hover:text-white items-center justify-center transition-all duration-200 backdrop-blur-sm z-20 hover:scale-105 active:scale-95 flex cursor-pointer shadow-md"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            aria-label="Siguiente promoción"
            className="absolute right-2.5 sm:right-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/30 hover:bg-black/60 text-white/90 hover:text-white items-center justify-center transition-all duration-200 backdrop-blur-sm z-20 hover:scale-105 active:scale-95 flex cursor-pointer shadow-md"
          >
            <ChevronRight className="w-5 h-5" />
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
              className={`col-start-1 row-start-1 space-y-4 sm:space-y-6 transition-opacity duration-700 ease-in-out ${
                isActive ? "opacity-100 z-10" : "opacity-0 pointer-events-none z-0"
              }`}
            >
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight leading-[0.98] text-white drop-shadow-lg font-display max-w-xl">
                {s.title}
              </h1>

              <p className="text-white/90 text-xs sm:text-sm md:text-base leading-relaxed font-medium drop-shadow max-w-lg line-clamp-3 sm:line-clamp-none">
                {s.subtitle}
              </p>

              <div className="pt-2 sm:pt-3">
                <Link
                  href={s.ctaHref || "#catalogo"}
                  suppressHydrationWarning
                  tabIndex={isActive ? 0 : -1}
                  className="inline-flex items-center justify-center gap-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white font-black text-xs sm:text-sm uppercase tracking-wider px-8 sm:px-10 py-3.5 sm:py-4 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 text-center font-display"
                >
                  <span>{s.ctaText || "ORDENA AQUÍ"}</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Indicadores Minimalistas Discretos al Fondo */}
      {slides.length > 1 && (
        <div className="absolute bottom-5 sm:bottom-6 left-0 right-0 flex items-center justify-center gap-2 z-10">
          {slides.map((s, idx) => (
            <button
              key={`${s.id}-dot-${idx}`}
              type="button"
              onClick={() => handleSelectSlide(idx)}
              aria-label={`Ir a promoción ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                idx === safeIndex
                  ? "w-8 bg-brand-primary shadow-sm"
                  : "w-2.5 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
