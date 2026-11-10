import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import {
  isPlatformHost,
  getTenantSubdomain,
  RESERVED_TENANT_SLUGS,
  DEFAULT_TENANT_SLUG,
} from "./tenant-context";
import { useTenantStore } from "@/features/tenant/store/useTenantStore";

export interface TenantRoutingResolution {
  hostname: string;
  isCustomDomain: boolean;
  subdomain: string | null;
  isPlatformHost: boolean;
  isPlatformRoot: boolean;
  activeTenantSlug: string;
  basePath: string;
  getHomeHref: (branchId?: number | string | null) => string;
  getCatalogHref: (branchId?: number | string | null) => string;
  getLoginHref: (options?: {
    tab?: "login" | "register" | "forgot-password" | "reset-password" | "verify-email";
    redirect?: string;
  }) => string;
  getRegisterHref: (options?: { redirect?: string }) => string;
  getCheckoutHref: () => string;
  getRastreoHref: (orderId?: string) => string;
  getSucursalesHref: (branchId?: number | string | null) => string;
  getKitchenHref: () => string;
  getDriverHref: () => string;
  getAdminHref: (section?: "personalizacion" | "inventario" | "sucursales" | "tenants" | "inventory" | "branches") => string;
  getSuperAdminHref: () => string;
  getTermsHref: () => string;
  getPrivacyHref: () => string;
}

export interface ResolveRoutingOptions {
  pathname?: string;
  hostname?: string;
  explicitSlug?: string | null;
  storeSlug?: string | null;
}

export const PLATFORM_BASE_DOMAINS = [
  "mesafy.com",
  "mesafy.app",
  "mesafy.dev",
  "mesafy.doicela.dev",
];

/**
 * Resuelve de forma pura el contexto de navegación multi-tenant y multi-sucursal.
 * Soporta de manera nativa y sin parches:
 * 1. Hosts de plataforma con prefijo /[slug] (ej: localhost:3005/la-granjita)
 * 2. Dominios personalizados propios (ej: pedidos.lagranjita.com, restaurant.ec)
 * 3. Subdominios de plataforma (ej: la-granjita.mesafy.com)
 * 4. Raíz de la plataforma global (ej: localhost:3005/)
 */
export function resolveTenantRouting(
  options: ResolveRoutingOptions = {}
): TenantRoutingResolution {
  const { pathname = "/", explicitSlug, storeSlug } = options;

  let hostname = options.hostname;
  if (!hostname && typeof window !== "undefined") {
    hostname = window.location.hostname;
  }
  const cleanHost = (hostname || "localhost").toLowerCase().split(":")[0];

  const hostIsPlatform = isPlatformHost(cleanHost);
  const isPlatformSub = PLATFORM_BASE_DOMAINS.some((base) =>
    cleanHost.endsWith(`.${base}`)
  );

  const rawSubdomain = getTenantSubdomain(cleanHost);
  // Un subdominio solo pertenece a la plataforma si el host padre es un dominio base de Mesafy
  const subdomain = isPlatformSub ? rawSubdomain : null;
  const isCustomDomain = !hostIsPlatform && !isPlatformSub;

  // Segmento inicial de ruta para identificar tenant en hosts de plataforma
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0]?.toLowerCase();
  const pathSlug =
    firstSegment && !RESERVED_TENANT_SLUGS.has(firstSegment) && !firstSegment.includes(".")
      ? firstSegment
      : undefined;

  // Prioridad de resolución del slug activo:
  // 1. Slug explícito pasado como parámetro
  // 2. Slug detectado en la ruta /[slug]/...
  // 3. Subdominio (la-granjita.mesafy.com)
  // 4. Slug almacenado en el store Zustand
  // 5. Fallback por defecto
  const resolvedSlug =
    explicitSlug ||
    pathSlug ||
    subdomain ||
    storeSlug ||
    DEFAULT_TENANT_SLUG;

  // Si estamos en la raíz del host de plataforma ("/") sin subdominio ni slug en ruta,
  // es la landing global multimarca de la plataforma.
  const isPlatformRoot =
    hostIsPlatform && !subdomain && (pathname === "/" || !pathSlug);

  // En dominios propios o subdominios, la vitrina vive en la raíz ("/") sin prefijos.
  // En host de plataforma (localhost, mesafy.com), si estamos dentro de un tenant,
  // el basePath canónico es "/[slug]".
  const basePath =
    isCustomDomain || subdomain || (hostIsPlatform && isPlatformRoot && !pathSlug)
      ? ""
      : `/${resolvedSlug}`;

  const appendBranchQuery = (url: string, branchId?: number | string | null): string => {
    if (branchId === undefined || branchId === null || branchId === "") {
      return url;
    }
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}branch=${encodeURIComponent(String(branchId))}`;
  };

  const getHomeHref = (branchId?: number | string | null): string => {
    if (isPlatformRoot && !pathSlug) {
      return "/";
    }
    const base = basePath || "/";
    return appendBranchQuery(base, branchId);
  };

  const getCatalogHref = (branchId?: number | string | null): string => {
    if (isPlatformRoot && !pathSlug) {
      return "/#restaurantes";
    }
    const base = basePath ? `${basePath}/menu` : "/menu";
    return appendBranchQuery(base, branchId);
  };

  const getLoginHref = (opts?: {
    tab?: "login" | "register" | "forgot-password" | "reset-password" | "verify-email";
    redirect?: string;
  }): string => {
    const url = basePath ? `${basePath}/login` : "/login";
    const params = new URLSearchParams();
    if (opts?.tab && opts.tab !== "login") {
      params.set("tab", opts.tab);
    }
    if (opts?.redirect) {
      params.set("redirect", opts.redirect);
    }
    const qs = params.toString();
    return qs ? `${url}?${qs}` : url;
  };

  const getRegisterHref = (opts?: { redirect?: string }): string => {
    return getLoginHref({ tab: "register", redirect: opts?.redirect });
  };

  const getCheckoutHref = (): string => {
    return basePath ? `${basePath}/checkout` : "/checkout";
  };

  const getRastreoHref = (orderId?: string): string => {
    if (orderId) {
      const cleanId = encodeURIComponent(orderId.trim());
      return basePath ? `${basePath}/rastreo/${cleanId}` : `/rastreo/${cleanId}`;
    }
    return basePath ? `${basePath}/rastreo` : "/rastreo";
  };

  const getSucursalesHref = (branchId?: number | string | null): string => {
    if (branchId !== undefined && branchId !== null && branchId !== "") {
      const cleanBranch = encodeURIComponent(String(branchId).trim());
      return basePath
        ? `${basePath}/sucursal/${cleanBranch}`
        : `/sucursal/${cleanBranch}`;
    }
    return basePath ? `${basePath}/sucursales` : "/sucursales";
  };

  const getKitchenHref = (): string => {
    return basePath ? `${basePath}/cocina` : "/cocina";
  };

  const getDriverHref = (): string => {
    return basePath ? `${basePath}/repartidor` : "/repartidor";
  };

  const getAdminHref = (
    section: "personalizacion" | "inventario" | "sucursales" | "tenants" | "inventory" | "branches" = "personalizacion"
  ): string => {
    return basePath ? `${basePath}/admin/${section}` : `/admin/${section}`;
  };

  const getSuperAdminHref = (): string => {
    return "/superadmin";
  };

  const getTermsHref = (): string => {
    return basePath ? `${basePath}/terminos` : "/terminos";
  };

  const getPrivacyHref = (): string => {
    return basePath ? `${basePath}/privacidad` : "/privacidad";
  };

  return {
    hostname: cleanHost,
    isCustomDomain,
    subdomain,
    isPlatformHost: hostIsPlatform,
    isPlatformRoot,
    activeTenantSlug: resolvedSlug,
    basePath,
    getHomeHref,
    getCatalogHref,
    getLoginHref,
    getRegisterHref,
    getCheckoutHref,
    getRastreoHref,
    getSucursalesHref,
    getKitchenHref,
    getDriverHref,
    getAdminHref,
    getSuperAdminHref,
    getTermsHref,
    getPrivacyHref,
  };
}

const noopSubscribe = () => () => {};

function getWindowHostname(): string {
  if (typeof window === "undefined") return "localhost";
  return window.location.hostname;
}

function getServerHostname(): string {
  return "localhost";
}

/**
 * Hook de React para acceder a las rutas canónicas del tenant activo con reactividad completa.
 */
export function useTenantRoutes(explicitSlug?: string | null): TenantRoutingResolution {
  const pathname = usePathname() || "/";
  const storeSlug = useTenantStore((s) => s.tenantSlug);
  const hostname = useSyncExternalStore(
    noopSubscribe,
    getWindowHostname,
    getServerHostname
  );

  return resolveTenantRouting({
    pathname,
    hostname,
    explicitSlug,
    storeSlug,
  });
}
