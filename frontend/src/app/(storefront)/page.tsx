import React, { Suspense } from "react";
import { headers } from "next/headers";
import { connection } from "next/server";
import type { Metadata } from "next";
import { PlatformLandingView } from "@/features/platform";
import { RestaurantStorefrontView } from "@/features/tenant/components/RestaurantStorefrontView";
import { isPlatformHost, getTenantSubdomain } from "@/shared/lib/api-client";
import { getFallbackTenantConfigByDomain } from "@/features/tenant/store/useTenantStore";

export async function generateMetadata(): Promise<Metadata> {
  await connection();
  const headersList = await headers();
  const rawHost =
    headersList.get("x-tenant-host") ||
    headersList.get("x-forwarded-host") ||
    headersList.get("host")?.split(":")[0] ||
    "";
  const host = rawHost.toLowerCase().trim();

  if (!isPlatformHost(host)) {
    const fallback = getFallbackTenantConfigByDomain(host);
    if (fallback) {
      return {
        title: `${fallback.name} | ${fallback.tagline}`,
        description: fallback.tagline,
      };
    }
  }

  const subdomain = getTenantSubdomain(host);
  if (subdomain) {
    const fallback = getFallbackTenantConfigByDomain(subdomain);
    if (fallback) {
      return {
        title: `${fallback.name} | ${fallback.tagline}`,
        description: fallback.tagline,
      };
    }
  }

  return {
    title: "Mesafy | Plataforma Gastronómica & Pedidos Multi-Restaurante",
    description: "Plataforma multitenant de pedidos en línea, terminales de salón/POS y delivery.",
  };
}

async function ServerTenantHomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const headersList = await headers();
  const rawHost =
    headersList.get("x-tenant-host") ||
    headersList.get("x-forwarded-host") ||
    headersList.get("host")?.split(":")[0] ||
    "localhost";
  const host = rawHost.toLowerCase().trim();

  const resolvedSearchParams = await searchParams;
  const explicitBrand =
    (typeof resolvedSearchParams.marca === "string" ? resolvedSearchParams.marca : undefined) ||
    (typeof resolvedSearchParams.restaurante === "string" ? resolvedSearchParams.restaurante : undefined) ||
    (typeof resolvedSearchParams.tenant === "string" ? resolvedSearchParams.tenant : undefined);

  // 1. Si se navega con parámetro de restaurante explícito (?marca=la-granjita)
  if (explicitBrand) {
    return <RestaurantStorefrontView initialSlug={explicitBrand} />;
  }

  // 2. Detección de Subdominio en cabecera HTTP del servidor (ej. lagranjita.mesafy.doicela.dev)
  const subdomainSlug = getTenantSubdomain(host);
  if (subdomainSlug) {
    return <RestaurantStorefrontView initialSlug={subdomainSlug} />;
  }

  // 3. Dominio Personalizado de Negocio (ej. asaderolagranjita.doicela.dev, pedidos.lagranjita.com)
  if (!isPlatformHost(host)) {
    const fallback = getFallbackTenantConfigByDomain(host);
    return <RestaurantStorefrontView initialSlug={fallback?.slug} />;
  }

  // 4. Por defecto en la raíz de la plataforma: Directorio multimarca global
  return <PlatformLandingView />;
}

export default function StorefrontHomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-canvas" />}>
      <ServerTenantHomePage searchParams={searchParams} />
    </Suspense>
  );
}




