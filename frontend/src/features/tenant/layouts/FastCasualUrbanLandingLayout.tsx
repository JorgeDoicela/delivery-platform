"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Zap,
  MapPin,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  OrderModeSelector,
  PromotionalBanners,
  CatalogSection,
} from "@/features/catalog";
import type { TenantStorefrontConfigDto } from "@/shared/types/api";
import { useTenantRoutes } from "@/shared/lib/tenant-routing";

interface FastCasualUrbanLandingLayoutProps {
  tenant: TenantStorefrontConfigDto | null | undefined;
}

export function FastCasualUrbanLandingLayout({
  tenant,
}: FastCasualUrbanLandingLayoutProps) {
  const routes = useTenantRoutes(tenant?.slug);
  const slides = tenant?.heroSlides ?? [];
  const primarySlide = slides[0];
  const brandName = tenant?.name ?? "Restaurante Urbano";
  const heroImage =
    primarySlide?.imageUrl || "/images/tenants/la-granjita/banners/hero-combo-familiar.jpg";

  return (
    <div className="w-full pb-4 sm:pb-12 space-y-8 sm:space-y-14 bg-surface-canvas text-text-strong">
      {/* 1. Split Hero Urbano Moderno */}
      <section className="w-full bg-surface-card border-b border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-primary text-white text-xs font-black uppercase tracking-widest font-display shadow-2xs">
              <Zap className="w-3.5 h-3.5 text-brand-accent" />
              <span>{primarySlide?.badge || tenant?.tagline || "Especialidad Express"}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight leading-none text-text-strong font-display">
              {primarySlide?.title || `DISFRUTA LO MEJOR DE ${brandName.toUpperCase()}`}
            </h1>

            <p className="text-text-muted text-sm sm:text-base leading-relaxed max-w-xl">
              {primarySlide?.subtitle ||
                tenant?.description ||
                "Preparación artesanal al instante, ingredientes seleccionados y entrega directa con rastreo satelital en vivo."}
            </p>

            <div className="grid grid-cols-3 gap-3 max-w-md pt-1">
              <div className="bg-surface-canvas border border-surface-border rounded-2xl p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
                  Envío Base
                </span>
                <span className="text-base font-black text-text-strong font-mono">
                  ${(tenant?.baseDeliveryFee ?? 1.5).toFixed(2)}
                </span>
              </div>
              <div className="bg-surface-canvas border border-surface-border rounded-2xl p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
                  Despacho
                </span>
                <span className="text-base font-black text-brand-primary font-mono">
                  25-35 min
                </span>
              </div>
              <div className="bg-surface-canvas border border-surface-border rounded-2xl p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
                  Locales
                </span>
                <span className="text-base font-black text-text-strong font-mono">
                  {tenant?.branches?.length || 1} Activo(s)
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <a
                href="#catalogo"
                className="inline-flex items-center gap-2 bg-brand-primary hover:bg-brand-primary-hover text-white font-black text-xs uppercase tracking-wider font-display px-8 py-4 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95"
              >
                <span>{primarySlide?.ctaText || "ORDENAR AHORA"}</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <Link
                href={routes.getSucursalesHref()}
                className="inline-flex items-center gap-2 bg-surface-canvas hover:bg-surface-card text-text-strong border border-surface-border font-bold text-xs uppercase tracking-wider px-6 py-4 rounded-full transition-colors"
              >
                <MapPin className="w-4 h-4 text-brand-primary" />
                <span>Ver Cobertura</span>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative aspect-[16/11] w-full rounded-3xl overflow-hidden shadow-2xl border border-surface-border bg-neutral-900">
              <Image
                src={heroImage}
                alt={primarySlide?.title || brandName}
                fill
                loading="eager"
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3 bg-surface-card/95 backdrop-blur-md border border-surface-border rounded-2xl px-4 py-3 shadow-lg">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-brand-primary shrink-0" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-text-strong font-display">
                      {brandName} • Pedido Directo
                    </p>
                    <p className="text-[11px] text-text-muted">
                      Sin recargos de intermediarios • Factura electrónica SRI
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shrink-0">
                  <Clock className="w-3 h-3" />
                  <span>Abierto</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Selector de Modalidad y Promociones */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-xs">
          <OrderModeSelector />
        </div>

        <PromotionalBanners tenant={tenant} />

        {/* 3. Catálogo Principal */}
        <section id="catalogo" className="space-y-6 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-4 border-b border-surface-border gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-brand-primary block mb-1">
                Menú Oficial en Línea
              </span>
              <h2
                className="text-3xl sm:text-4xl font-black text-text-strong uppercase tracking-tight font-display"
                suppressHydrationWarning
              >
                Nuestra Carta
              </h2>
              <p
                className="text-xs sm:text-sm text-text-muted mt-1 leading-relaxed"
                suppressHydrationWarning
              >
                {tenant?.heroSubtitle ||
                  "Personaliza cada plato a tu gusto y recibe tu orden recién preparada."}
              </p>
            </div>
          </div>

          <CatalogSection tenantSlug={tenant?.slug} />
        </section>
      </div>
    </div>
  );
}

