"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
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

  // Soporte de gesto de arrastre horizontal unificado (mouse en PC y touch en móvil)
  const pointerStartX = useRef<number | null>(null);
  const pointerStartY = useRef<number | null>(null);
  const isDragging = useRef(false);

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

  const handlePointerDown = (e: React.PointerEvent) => {
    if (slides.length <= 1) return;
    if (e.button !== 0) return; // Solo clic principal o touch
    pointerStartX.current = e.clientX;
    pointerStartY.current = e.clientY;
    isDragging.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (pointerStartX.current === null) return;
    const diffX = e.clientX - pointerStartX.current;
    if (Math.abs(diffX) > 8) {
      isDragging.current = true;
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (pointerStartX.current === null) return;
    const diffX = e.clientX - pointerStartX.current;
    const diffY = e.clientY - (pointerStartY.current ?? 0);

    // Umbral de 40px con mayor componente horizontal que vertical
    if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }

    pointerStartX.current = null;
    pointerStartY.current = null;
    setTimeout(() => {
      isDragging.current = false;
    }, 50);
  };

  const handlePointerCancel = () => {
    pointerStartX.current = null;
    pointerStartY.current = null;
    isDragging.current = false;
  };

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
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      className="relative overflow-hidden w-full min-h-[380px] sm:min-h-[520px] md:min-h-[580px] lg:min-h-[610px] bg-neutral-950 text-white shadow-xl flex items-center py-8 sm:py-16 md:py-20 px-4 sm:px-8 md:px-14 lg:px-20 select-none touch-pan-y cursor-grab active:cursor-grabbing"
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
                className="object-cover object-right pointer-events-none"
              />
            </div>

            {/* Gradiente Cinematográfico Suave que Resalta la Comida */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/45 to-transparent sm:from-black/80 sm:via-black/35 sm:to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          </div>
        );
      })}

      {/* Flechas de Navegación: Ocultas en móvil (< sm), visibles en pantallas medianas y de escritorio */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Anterior promoción"
            className="hidden sm:flex absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/30 hover:bg-black/60 text-white/90 hover:text-white items-center justify-center transition-all duration-200 backdrop-blur-sm z-20 hover:scale-105 active:scale-95 cursor-pointer shadow-md"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            aria-label="Siguiente promoción"
            className="hidden sm:flex absolute right-2.5 sm:right-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/30 hover:bg-black/60 text-white/90 hover:text-white items-center justify-center transition-all duration-200 backdrop-blur-sm z-20 hover:scale-105 active:scale-95 cursor-pointer shadow-md"
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
              className={`col-start-1 row-start-1 space-y-3 sm:space-y-6 transition-opacity duration-700 ease-in-out ${
                isActive ? "opacity-100 z-10" : "opacity-0 pointer-events-none z-0"
              }`}
            >
              <h1 className="text-2xl xs:text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight leading-[1] text-white drop-shadow-lg font-display max-w-[270px] xs:max-w-xs sm:max-w-xl">
                {s.title}
              </h1>

              <p className="text-white/90 text-xs sm:text-sm md:text-base leading-relaxed font-medium drop-shadow max-w-[260px] xs:max-w-xs sm:max-w-lg line-clamp-3 sm:line-clamp-none">
                {s.subtitle}
              </p>

              <div className="pt-2 sm:pt-3">
                <Link
                  href={s.ctaHref || "#catalogo"}
                  suppressHydrationWarning
                  tabIndex={isActive ? 0 : -1}
                  onClick={(e) => {
                    if (isDragging.current) {
                      e.preventDefault();
                    }
                  }}
                  className="inline-flex items-center justify-center gap-2 sm:gap-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white font-black text-xs sm:text-sm uppercase tracking-wider px-7 sm:px-10 py-3 sm:py-4 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 text-center font-display"
                >
                  <span>{s.ctaText || "ORDENA AQUÍ"}</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Indicadores de Paginación más Visibles y Fáciles de Tocar */}
      {slides.length > 1 && (
        <div className="absolute bottom-3 sm:bottom-6 left-0 right-0 flex items-center justify-center gap-2.5 sm:gap-3 z-10">
          {slides.map((s, idx) => (
            <button
              key={`${s.id}-dot-${idx}`}
              type="button"
              onClick={() => handleSelectSlide(idx)}
              aria-label={`Ir a promoción ${idx + 1}`}
              className={`h-2 sm:h-3 rounded-full transition-all duration-300 cursor-pointer ${
                idx === safeIndex
                  ? "w-8 sm:w-12 bg-brand-primary shadow-md"
                  : "w-2.5 sm:w-3.5 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
