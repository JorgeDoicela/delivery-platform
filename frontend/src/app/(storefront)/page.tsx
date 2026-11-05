"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PlatformLandingView } from "@/features/platform";
import { RestaurantStorefrontView } from "@/features/tenant/components/RestaurantStorefrontView";
import { RESERVED_TENANT_SLUGS } from "@/shared/lib/api-client";

function HomePageContent() {
  const searchParams = useSearchParams();
  const explicitBrand =
    searchParams.get("marca") ||
    searchParams.get("restaurante") ||
    searchParams.get("tenant");

  // 1. Si se navega con parámetro de restaurante explícito (?marca=la-granjita)
  if (explicitBrand) {
    return <RestaurantStorefrontView initialSlug={explicitBrand} />;
  }

  // 2. Detección de Subdominio en navegador (ej. lagranjita.mesafy.doicela.dev)
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname.toLowerCase();
    const parts = hostname.split(".");
    if (
      parts.length > 2 &&
      parts[0] !== "www" &&
      parts[0] !== "api" &&
      !RESERVED_TENANT_SLUGS.has(parts[0])
    ) {
      return <RestaurantStorefrontView initialSlug={parts[0]} />;
    }
  }

  // 3. Por defecto en la raíz: Landing Principal de la Plataforma Multi-Tenant
  return <PlatformLandingView />;
}

export default function StorefrontHomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-canvas" />}>
      <HomePageContent />
    </Suspense>
  );
}




