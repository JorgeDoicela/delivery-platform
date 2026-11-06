"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PlatformLandingView } from "@/features/platform";
import { RestaurantStorefrontView } from "@/features/tenant/components/RestaurantStorefrontView";
import { isPlatformHost, getTenantSubdomain } from "@/shared/lib/api-client";

const noopSubscribe = () => () => {};

function getSubdomainSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  return getTenantSubdomain(window.location.hostname);
}

function getIsCustomDomainSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  return !isPlatformHost(window.location.hostname);
}

function getServerSnapshot(): string | null {
  return null;
}

function getServerBooleanSnapshot(): boolean {
  return false;
}

function HomePageContent() {
  const searchParams = useSearchParams();
  const subdomainSlug = React.useSyncExternalStore(
    noopSubscribe,
    getSubdomainSnapshot,
    getServerSnapshot
  );
  const isCustomDomain = React.useSyncExternalStore(
    noopSubscribe,
    getIsCustomDomainSnapshot,
    getServerBooleanSnapshot
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

  // 3. Dominio Personalizado de Negocio (ej. pedidos.lagranjita.com)
  if (isCustomDomain) {
    return <RestaurantStorefrontView />;
  }

  // 4. Por defecto en la raíz de la plataforma: Directorio multimarca global
  return <PlatformLandingView />;
}

export default function StorefrontHomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-canvas" />}>
      <HomePageContent />
    </Suspense>
  );
}




