import { NextRequest, NextResponse } from "next/server";
import { getApiBaseUrl } from "@/shared/lib/api-client";
import {
  isPlatformHost,
  getTenantSubdomain,
  RESERVED_TENANT_SLUGS,
} from "@/shared/lib/tenant-context";
import { FALLBACK_TENANT_CONFIGS } from "@/features/tenant/store/useTenantStore";
import type { TenantStorefrontConfigDto } from "@/shared/types/api";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  let slug = url.searchParams.get("slug")?.trim() || null;
  let branchParam = url.searchParams.get("branch")?.trim() || null;

  // Fallback 1: Si no viene en searchParams, analizar la cabecera Referer
  const referer = request.headers.get("referer");
  if (!slug && referer) {
    try {
      const refUrl = new URL(referer);
      if (!branchParam && refUrl.searchParams.has("branch")) {
        branchParam = refUrl.searchParams.get("branch")?.trim() || null;
      }
      if (refUrl.searchParams.has("slug")) {
        slug = refUrl.searchParams.get("slug")?.trim() || null;
      }

      if (!slug) {
        const segments = refUrl.pathname.split("/").filter(Boolean);
        if (segments.length > 0 && !RESERVED_TENANT_SLUGS.has(segments[0].toLowerCase())) {
          slug = segments[0];
        }
        if (!branchParam) {
          const sucursalIdx = segments.findIndex((s) => s === "sucursal" || s === "sucursales");
          if (sucursalIdx !== -1 && segments[sucursalIdx + 1]) {
            branchParam = segments[sucursalIdx + 1];
          }
        }
      }
    } catch {
      // Ignorar errores de referer invalido
    }
  }

  // Fallback 2: Inspeccionar el host para subdominios multi-tenant
  const host = request.headers.get("host") || "";
  if (!slug && host) {
    const subdomain = getTenantSubdomain(host);
    if (subdomain && !RESERVED_TENANT_SLUGS.has(subdomain.toLowerCase())) {
      slug = subdomain;
    }
  }

  // Si el slug detectado coincide con rutas reservadas de la plataforma, omitir
  if (slug && RESERVED_TENANT_SLUGS.has(slug.toLowerCase())) {
    slug = null;
  }

  // CASO A: MANIFEST MULTI-TENANT (Tienda o Sucursal)
  if (slug) {
    const isCustomDomain = !isPlatformHost(host) || Boolean(getTenantSubdomain(host));

    let tenantConfig: TenantStorefrontConfigDto | null = null;
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/tenants/current`, {
        headers: {
          "X-Tenant-Slug": slug,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(1500),
      });
      if (res.ok) {
        tenantConfig = await res.json();
      }
    } catch {
      // Si la API no esta disponible o falla, usar configuracion fallback
    }

    if (!tenantConfig) {
      tenantConfig = FALLBACK_TENANT_CONFIGS[slug] || {
        id: "00000000-0000-0000-0000-000000000000",
        slug,
        name: slug
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" "),
        tagline: "Restaurante",
        description: `Menú en línea, especialidades recién preparadas y despacho a domicilio en ${slug}.`,
        heroSubtitle: "",
        businessName: slug,
        taxId: "",
        logoUrl: `/images/tenants/${slug}/identidad/logo.png`,
        brandPrimaryColor: "#E4002B",
        brandPrimaryHoverColor: "#C40024",
        brandAccentColor: "#F59E0B",
        contactPhone: "",
        contactEmail: "",
        currencyCode: "USD",
        baseDeliveryFee: 1.5,
        enableDelivery: true,
        enableTakeout: true,
        enableDineIn: true,
        acceptsCash: true,
        acceptsBankTransfer: true,
        acceptsCard: false,
        quickLinksEnabled: true,
        landingLayoutTemplate: "asadero-clasico",
        bankDetails: {
          bankName: "",
          accountType: "",
          accountNumber: "",
          accountHolder: "",
          taxId: "",
        },
        heroSlides: [],
        promotionalBanners: [],
        branches: [],
      };
    }

    const matchedBranch =
      branchParam && tenantConfig.branches
        ? tenantConfig.branches.find(
            (b) => String(b.id) === branchParam || b.name.toLowerCase() === branchParam.toLowerCase()
          )
        : null;

    const appName = matchedBranch
      ? `${tenantConfig.name} • Sucursal ${matchedBranch.name}`
      : tenantConfig.tagline
      ? `${tenantConfig.name} - ${tenantConfig.tagline}`
      : tenantConfig.name;

    const shortName = matchedBranch
      ? `${tenantConfig.name} (${matchedBranch.name})`
      : tenantConfig.name;

    const startUrl = isCustomDomain
      ? matchedBranch
        ? `/?branch=${matchedBranch.id}`
        : "/"
      : matchedBranch
      ? `/${slug}?branch=${matchedBranch.id}`
      : `/${slug}`;

    const scope = isCustomDomain ? "/" : `/${slug}/`;
    const appId = isCustomDomain
      ? matchedBranch
        ? `/?branch=${matchedBranch.id}`
        : "/"
      : matchedBranch
      ? `/${slug}?branch=${matchedBranch.id}`
      : `/${slug}`;

    const logoUrl = tenantConfig.logoUrl || `/images/tenants/${slug}/identidad/logo.png`;

    const tenantManifest = {
      id: appId,
      name: appName,
      short_name: shortName,
      description:
        tenantConfig.description ||
        `Menú digital, despacho a domicilio y atención en línea de ${tenantConfig.name}.`,
      start_url: startUrl,
      scope,
      display: "standalone",
      orientation: "portrait",
      background_color: "#ffffff",
      theme_color: tenantConfig.brandPrimaryColor || "#E4002B",
      categories: ["food", "shopping", "business"],
      icons: [
        {
          src: logoUrl,
          sizes: "192x192",
          type: "image/png",
          purpose: "any maskable",
        },
        {
          src: logoUrl,
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable",
        },
      ],
      shortcuts: [
        {
          name: "Ver Menú",
          short_name: "Menú",
          description: `Menú en línea de ${tenantConfig.name}`,
          url: isCustomDomain ? "/menu" : `/${slug}/menu`,
          icons: [{ src: logoUrl, sizes: "96x96", type: "image/png" }],
        },
        {
          name: "Mis Pedidos",
          short_name: "Pedidos",
          description: "Rastrea tus pedidos en curso",
          url: isCustomDomain ? "/pedidos" : `/${slug}/pedidos`,
          icons: [{ src: logoUrl, sizes: "96x96", type: "image/png" }],
        },
      ],
    };

    return NextResponse.json(tenantManifest, {
      status: 200,
      headers: {
        "Content-Type": "application/manifest+json; charset=utf-8",
        "Cache-Control": "public, max-age=60, stale-while-revalidate=120",
      },
    });
  }

  // CASO B: MANIFEST GLOBAL DE PLATAFORMA (Directorio Mesafy)
  const platformManifest = {
    id: "/",
    name: "Mesafy | Plataforma Gastronómica",
    short_name: "Mesafy",
    description:
      "Gestión integral para restaurantes: pedidos en línea, cocina y delivery en tiempo real.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0f172a",
    theme_color: "#0f172a",
    categories: ["food", "business"],
    icons: [
      {
        src: "/images/platform/logo.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/images/platform/logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
    shortcuts: [
      {
        name: "Explorar Restaurantes",
        short_name: "Restaurantes",
        description: "Directorio de restaurantes afiliados",
        url: "/",
        icons: [{ src: "/images/platform/logo.png", sizes: "96x96", type: "image/png" }],
      },
    ],
  };

  return NextResponse.json(platformManifest, {
    status: 200,
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      "Cache-Control": "public, max-age=60, stale-while-revalidate=120",
    },
  });
}
