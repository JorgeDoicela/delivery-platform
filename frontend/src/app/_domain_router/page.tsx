import React from "react";
import { RestaurantStorefrontView } from "@/features/tenant/components/RestaurantStorefrontView";
import { PlatformLandingView } from "@/features/platform";

interface DomainRouterProps {
  searchParams: Promise<{
    host?: string;
    subdomain?: string;
  }>;
}

async function resolveTenantSlugByHost(host: string): Promise<string | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5005";
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
    // Si la llamada falla o no hay conexión, retorna null de forma segura
  }
  return null;
}

export default async function DomainRouterPage({ searchParams }: DomainRouterProps) {
  const { host, subdomain } = await searchParams;

  // 1. Si vino con subdominio explícito ({slug}.dominio.com), renderizar la tienda de ese slug
  if (subdomain) {
    return <RestaurantStorefrontView initialSlug={subdomain} />;
  }

  // 2. Si vino con host personalizado (ej. pedidos.elbrasero.com o elgaucho.com), resolver tenant
  if (host) {
    const resolvedSlug = await resolveTenantSlugByHost(host);
    if (resolvedSlug) {
      return <RestaurantStorefrontView initialSlug={resolvedSlug} />;
    }
  }

  // 3. Fallback a la landing principal de la plataforma
  return <PlatformLandingView />;
}
