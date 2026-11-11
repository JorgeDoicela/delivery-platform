"use client";

import React from "react";
import {
  CatalogHero,
  OrderModeSelector,
  PromotionalBanners,
  PopularProductsSection,
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
    <div className="w-full pb-4 sm:pb-12 space-y-8 sm:space-y-14">
      {/* 1. Hero Slider Panorámico */}
      <CatalogHero tenant={tenant} />

      <div className="w-full px-3.5 sm:px-8 lg:px-12 space-y-10 sm:space-y-16 md:space-y-20">
        {/* 2. Selector de Modalidad (Delivery / Salón / Takeout) */}
        <OrderModeSelector />

        {/* 3. Platos Más Pedidos y Populares de la Landing */}
        <section
          id="catalogo"
          className="max-w-[1240px] mx-auto w-full"
        >
          <PopularProductsSection tenantSlug={tenant?.slug} limit={8} />
        </section>

        {/* 4. Banners Promocionales del Establecimiento */}
        <PromotionalBanners tenant={tenant} />

        {/* 5. Ubicación, Casa Matriz y Cobertura Geolocalizada */}
        <StorefrontBranchShowcase tenant={tenant} />
      </div>
    </div>
  );
}

