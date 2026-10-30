"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Flame,
  Award,
  Clock,
  Sparkles,
  ShieldCheck,
  MapPin,
  UtensilsCrossed,
} from "lucide-react";
import {
  OrderModeSelector,
  CatalogSection,
} from "@/features/catalog";
import type { TenantStorefrontConfigDto } from "@/shared/types/api";

interface SteakhouseGourmetLandingLayoutProps {
  tenant: TenantStorefrontConfigDto | null | undefined;
}

export function SteakhouseGourmetLandingLayout({
  tenant,
}: SteakhouseGourmetLandingLayoutProps) {
  const slides = tenant?.heroSlides ?? [];
  const primarySlide = slides[0];

  return (
    <div className="w-full pb-16 space-y-16 bg-neutral-950 text-white">
      {/* 1. Hero Cinematográfico Gourmet Steakhouse */}
      <section className="relative w-full min-h-[580px] lg:min-h-[640px] flex items-center overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 z-0">
          <Image
            src={primarySlide?.imageUrl || "/images/banners/hero-pollo-brasa.jpg"}
            alt={primarySlide?.title || "Cortes Angus Madurados"}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center filter brightness-[0.45] contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-neutral-950/40" />
        </div>

        <div className="relative z-10 max-w-[1240px] mx-auto px-6 sm:px-10 lg:px-12 w-full py-16">
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-widest backdrop-blur-md">
              <Flame className="w-4 h-4 text-emerald-400" />
              <span>{primarySlide?.badge || "Parrilla de Autor & Cortes Angus"}</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight leading-none text-white font-display">
              {primarySlide?.title || "CORTES ANGUS AL QUEBRACHO"}
            </h1>

            <p className="text-neutral-300 text-sm sm:text-base leading-relaxed max-w-xl font-medium">
              {primarySlide?.subtitle ||
                "Maduración en seco por 28 días, sellado a fuego vivo con sal en escamas y chimichurri artesanal de autor."}
            </p>

            {/* Ficha técnica rápida de cocción gourmet */}
            <div className="grid grid-cols-3 gap-3 pt-2 max-w-lg border-y border-white/10 py-3.5">
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                  Leña & Fuego
                </span>
                <span className="text-sm font-black text-white font-mono">Quebracho</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                  Maduración
                </span>
                <span className="text-sm font-black text-emerald-400 font-mono">28 Días Dry</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                  Puntos
                </span>
                <span className="text-sm font-black text-white font-mono">Bleu • 3/4 • Well</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href="#catalogo"
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider px-8 py-4 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95"
              >
                <span>VER CARTA DE CORTES</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <Link
                href="/sucursales"
                className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider px-6 py-4 rounded-full border border-white/20 transition-all backdrop-blur-md"
              >
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>Salón & Cava Cumbayá</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Sección Exclusiva Steakhouse: Pilares de Calidad y Cámara de Maduración */}
      <section className="max-w-[1240px] mx-auto px-6 sm:px-10 lg:px-12 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Award className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-black uppercase tracking-tight text-white font-display">
              Cortes Angus Certificados
            </h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Selección de lomo fino, bife de chorizo y asado de tira con marmoleo grado superior para garantizar jugosidad extrema.
            </p>
          </div>

          <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Clock className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-black uppercase tracking-tight text-white font-display">
              Cámara de Maduración Controlada
            </h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              28 días de reposo bajo temperatura y humedad de precisión que concentran las notas ahumadas naturales de la carne.
            </p>
          </div>

          <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-accent/10 border border-brand-accent/30 flex items-center justify-center text-amber-300">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-black uppercase tracking-tight text-white font-display">
              Salsas & Chimichurri de Autor
            </h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Elaborados cada mañana con hierbas frescas del huerto, ajo asado en horno de leña y aceite de oliva virgen extra.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Selector de Modalidad y Cobertura */}
      <div className="max-w-[1240px] mx-auto px-6 sm:px-10 lg:px-12 w-full space-y-8">
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-6">
          <OrderModeSelector />
        </div>

        {/* 4. Carta de Cortes & Menú Especial */}
        <section id="catalogo" className="space-y-6 pt-4 w-full">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-4 border-b border-neutral-800 gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400 block mb-1">
                La Carta de la Brasa
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight font-display">
                Cortes, Parrilladas & Entradas
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                {tenant?.heroSubtitle || "Pide a domicilio con empaque térmico al vacío para conservar el calor de la brasa"}
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-400 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Plantilla: Steakhouse Gourmet</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 text-neutral-900 shadow-2xl">
            <CatalogSection />
          </div>
        </section>

        {/* 5. Pie de Página Gourmet / Franquicia */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white uppercase">{tenant?.name} • Boutique de Carnes</p>
              <p className="text-[11px]">{tenant?.businessName} • RUC {tenant?.taxId}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/admin/personalizacion"
              className="px-4 py-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white font-bold uppercase tracking-wider text-[11px] transition-colors"
            >
              Configurar Marca
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase tracking-wider text-[11px] transition-colors"
            >
              Acceso Staff
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

