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
  const heroSubtitle =
    tenant?.heroSubtitle ||
    "Personaliza tu orden con acompañamientos y guarniciones recién preparadas";

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
          className="max-w-[1240px] mx-auto space-y-6 pt-6 w-full"
        >
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-brand-primary block mb-1">
                {tenant?.tagline || "Especialidades de la Casa"}
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-text-strong uppercase tracking-wide font-display" suppressHydrationWarning>
                Menú y Combos • {tenant?.name ?? "Restaurante"}
              </h2>
              <p className="text-xs sm:text-sm text-text-muted mt-0.5" suppressHydrationWarning>
                {heroSubtitle}
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

