"use client";

import React from "react";
import {
  CatalogHero,
  OrderModeSelector,
  PromotionalBanners,
  CatalogSection,
} from "@/features/catalog";
import { StorefrontBranchShowcase } from "@/features/tenant";
import type { TenantStorefrontConfigDto } from "@/shared/types/api";

interface AsaderoClassicLandingLayoutProps {
  tenant: TenantStorefrontConfigDto | null | undefined;
}

export function AsaderoClassicLandingLayout({
  tenant,
}: AsaderoClassicLandingLayoutProps) {
  return (
    <div className="w-full pb-12 space-y-12">
      {/* 1. Hero Slider Panorámico */}
      <CatalogHero tenant={tenant} />

      <div className="w-full px-4 sm:px-8 lg:px-12 space-y-12">
        {/* 2. Selector de Modalidad (Delivery / Salón / Takeout) */}
        <OrderModeSelector />

        {/* 3. Banners Promocionales del Establecimiento */}
        <PromotionalBanners tenant={tenant} />

        {/* 4. Menú y Combos del Establecimiento */}
        <section
          id="catalogo"
          className="max-w-[1240px] mx-auto space-y-6 pt-4 w-full"
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-4 border-b border-surface-border gap-2">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-brand-primary block mb-1 font-sans">
                {tenant?.tagline || "Especialidades del Asador"}
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-text-strong uppercase tracking-wide font-display" suppressHydrationWarning>
                Nuestra Carta
              </h2>
              <p className="text-xs sm:text-sm text-text-muted mt-1 leading-relaxed" suppressHydrationWarning>
                {tenant?.heroSubtitle || "Personaliza tus porciones con guarniciones calientes, ensalada fresca y ají artesanal."}
              </p>
            </div>
          </div>

          <CatalogSection tenantSlug={tenant?.slug} />
        </section>



        {/* 5. Ubicación, Casa Matriz y Cobertura Geolocalizada */}
        <StorefrontBranchShowcase tenant={tenant} />
      </div>
    </div>
  );
}

