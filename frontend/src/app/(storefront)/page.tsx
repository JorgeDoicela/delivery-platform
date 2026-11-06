"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PlatformLandingView } from "@/features/platform";
import { RestaurantStorefrontView } from "@/features/tenant/components/RestaurantStorefrontView";
import { RESERVED_TENANT_SLUGS } from "@/shared/lib/api-client";

const noopSubscribe = () => () => {};

function getSubdomainSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  const hostname = window.location.hostname.toLowerCase();
  const parts = hostname.split(".");
  if (
    parts.length > 2 &&
    parts[0] !== "www" &&
    parts[0] !== "api" &&
    !RESERVED_TENANT_SLUGS.has(parts[0])
  ) {
    return parts[0];
  }
  return null;
}

function getServerSnapshot(): string | null {
  return null;
}

function HomePageContent() {
  const searchParams = useSearchParams();
  const subdomainSlug = React.useSyncExternalStore(
    noopSubscribe,
    getSubdomainSnapshot,
    getServerSnapshot
  );

  const explicitBrand =
    searchParams.get("marca") ||
    searchParams.get("restaurante") ||
    searchParams.get("tenant");

  // 1. Si se navega con parámetro de restaurante explícito (?marca=la-granjita)
  if (explicitBrand) {
    return <RestaurantStorefrontView initialSlug={explicitBrand} />;
  }

  // 2. Detección de Subdominio en navegador (ej. lagranjita.mesafy.doicela.dev)
  if (subdomainSlug) {
    return <RestaurantStorefrontView initialSlug={subdomainSlug} />;
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




