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

  // Si se navega con parámetro de restaurante explícito (?marca=brasas-del-valle)
  if (explicitBrand) {
    return <RestaurantStorefrontView initialSlug={explicitBrand} />;
  }

  // Por defecto en la raíz (http://localhost:3005/): Landing Principal de la Plataforma Multi-Tenant
  return <PlatformLandingView />;
}

export default function StorefrontHomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-canvas" />}>
      <HomePageContent />
    </Suspense>
  );
}




