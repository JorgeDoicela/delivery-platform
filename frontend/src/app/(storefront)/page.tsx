import React, { Suspense } from "react";
import { headers } from "next/headers";
import { PlatformLandingView } from "@/features/platform";
import { RestaurantStorefrontView } from "@/features/tenant/components/RestaurantStorefrontView";

interface HomePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function resolveTenantSlugByHost(host: string): Promise<string | null> {
  try {
    const apiUrl =
      process.env.INTERNAL_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:5005";
    const res = await fetch(`${apiUrl}/api/tenants/current`, {
      headers: {
        Host: host,
        Accept: "application/json",
      },
      next: { revalidate: 60 },
    });

    if (res.ok) {
      const tenant = await res.json();
      return tenant?.slug ?? null;
    }
  } catch {
    // Retornar null ante excepciones de conexion
  }
  return null;
}

export default async function StorefrontHomePage({ searchParams }: HomePageProps) {
  const resolvedSearchParams = await searchParams;
  const explicitBrand =
    (typeof resolvedSearchParams.marca === "string" && resolvedSearchParams.marca) ||
    (typeof resolvedSearchParams.restaurante === "string" && resolvedSearchParams.restaurante) ||
    (typeof resolvedSearchParams.tenant === "string" && resolvedSearchParams.tenant) ||
    null;

  // 1. Si se navega con parámetro de restaurante explícito (?marca=la-granjita)
  if (explicitBrand) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-surface-canvas" />}>
        <RestaurantStorefrontView initialSlug={explicitBrand} />
      </Suspense>
    );
  }

  // 2. Detección de Dominio Personalizado o Subdominio de Comercio
  const headersList = await headers();
  const rawHost = headersList.get("x-forwarded-host") || headersList.get("host") || "localhost";
  const hostname = rawHost.split(":")[0].toLowerCase();

  const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN?.toLowerCase() || "mesafy.doicela.dev";
  const isPlatformHost =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === platformDomain ||
    hostname === `www.${platformDomain}` ||
    hostname === "mesafy.doicela.dev" ||
    hostname === "www.mesafy.doicela.dev" ||
    hostname === "delivery.com" ||
    hostname === "www.delivery.com";

  if (!isPlatformHost) {
    // Subdominio de la plataforma (ej. lagranjita.mesafy.doicela.dev)
    if (hostname.endsWith(`.${platformDomain}`)) {
      const sub = hostname.replace(`.${platformDomain}`, "");
      if (sub && sub !== "www" && sub !== "api" && sub !== "mesafy") {
        return (
          <Suspense fallback={<div className="min-h-screen bg-surface-canvas" />}>
            <RestaurantStorefrontView initialSlug={sub} />
          </Suspense>
        );
      }
    }

    // Dominio personalizado del comercio (ej. pedidos.elbrasero.com)
    const resolvedSlug = await resolveTenantSlugByHost(hostname);
    if (resolvedSlug) {
      return (
        <Suspense fallback={<div className="min-h-screen bg-surface-canvas" />}>
          <RestaurantStorefrontView initialSlug={resolvedSlug} />
        </Suspense>
      );
    }
  }

  // 3. Raíz de la plataforma principal
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-canvas" />}>
      <PlatformLandingView />
    </Suspense>
  );
}




