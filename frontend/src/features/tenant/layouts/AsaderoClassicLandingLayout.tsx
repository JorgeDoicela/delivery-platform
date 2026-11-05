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
    <div className="w-full pb-12 space-y-12">
      {/* 1. Hero Slider Panorámico */}
      <CatalogHero tenant={tenant} />

      <div className="w-full px-4 sm:px-8 lg:px-12 space-y-12">
        {/* 2. Selector de Modalidad (Delivery / Salón / Takeout) */}
        <OrderModeSelector />

        {/* 3. Banners Promocionales del Establecimiento */}
        <PromotionalBanners tenant={tenant} />

        {/* 4. Platos Más Pedidos y Populares de la Landing */}
        <section
          id="catalogo"
          className="max-w-[1240px] mx-auto pt-4 w-full"
        >
          <PopularProductsSection tenantSlug={tenant?.slug} limit={6} />
        </section>



        {/* 5. Ubicación, Casa Matriz y Cobertura Geolocalizada */}
        <StorefrontBranchShowcase tenant={tenant} />
      </div>
    </div>
  );
}

