"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PlatformLandingView } from "@/features/platform";
import { RestaurantStorefrontView } from "@/features/tenant/components/RestaurantStorefrontView";

function HomePageContent() {
  const searchParams = useSearchParams();
  const explicitBrand =
    searchParams.get("marca") ||
    searchParams.get("restaurante") ||
    searchParams.get("tenant");

  // Si el usuario navegó con parámetro explícito de restaurante, muestra la tienda
  if (explicitBrand) {
    return <RestaurantStorefrontView initialSlug={explicitBrand} />;
  }

  // Por defecto en la raíz: Landing Institucional SaaS B2B
  return <PlatformLandingView />;
}

export default function StorefrontHomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-canvas" />}>
      <HomePageContent />
    </Suspense>
  );
}


