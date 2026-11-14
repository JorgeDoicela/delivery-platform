export const ACTIVE_TENANT_STORAGE_KEY = "delivery_active_tenant_slug";
export const DEFAULT_TENANT_SLUG = "la-granjita";

export const PLATFORM_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "mesafy.com",
  "www.mesafy.com",
  "mesafy.app",
  "www.mesafy.app",
  "mesafy.dev",
  "mesafy.doicela.dev",
  "platform.mesafy.com",
]);

if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_PLATFORM_DOMAIN) {
  const envDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN.toLowerCase().trim();
  if (envDomain) {
    PLATFORM_HOSTS.add(envDomain);
    PLATFORM_HOSTS.add(`www.${envDomain}`);
  }
}

export function isPlatformHost(hostname?: string): boolean {
  if (!hostname) return true;
  const cleanHost = hostname.split(":")[0].toLowerCase().trim();
  if (PLATFORM_HOSTS.has(cleanHost)) return true;
  // Subdominios de preview Vercel / Cloudflare para la plataforma raíz
  if (cleanHost.endsWith(".vercel.app") && !cleanHost.includes("---")) {
    return true;
  }
  return false;
}

export function getTenantSubdomain(hostname?: string): string | null {
  if (!hostname) return null;
  const cleanHost = hostname.split(":")[0].toLowerCase().trim();
  if (cleanHost === "localhost" || cleanHost === "127.0.0.1" || cleanHost === "::1") {
    return null;
  }
  const parts = cleanHost.split(".");
  const reservedSubdomains = new Set([
    "www",
    "api",
    "mesafy",
    "platform",
    "app",
    "admin",
    "mail",
    "cdn",
    "assets",
    "static",
  ]);

  if (parts.length > 2 && !reservedSubdomains.has(parts[0])) {
    return parts[0];
  }
  return null;
}

export function getApiClientTenantDomain(): string | null {
  if (typeof window === "undefined") return null;
  const host = window.location.hostname.toLowerCase().trim();
  if (!isPlatformHost(host) && !getTenantSubdomain(host)) {
    return host;
  }
  return null;
}

export const RESERVED_TENANT_SLUGS = new Set([
  "admin",
  "superadmin",
  "api",
  "login",
  "checkout",
  "catalogo",
  "finalizar-pedido",
  "cocina",
  "kitchen",
  "repartidor",
  "active-delivery",
  "pedidos",
  "mis-pedidos",
  "rastreo",
  "track",
  "sucursales",
  "sucursal",
  "terminos",
  "privacidad",
  "terms",
  "privacy",
  "static",
  "assets",
  "health",
  "hub",
  "hubs",
  "ws",
  "auth",
  "register",
  "cart",
  "favicon",
  "robots",
  "r",
  "mesafy",
  "_domain_router",
  "domain-router",
]);

let currentTenantSlugMemory: string | null = null;
let currentAccessTokenMemory: string | null = null;

export function setApiClientTenantSlug(slug: string | null): void {
  if (!slug) {
    currentTenantSlugMemory = null;
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(ACTIVE_TENANT_STORAGE_KEY);
      } catch {
        // Ignorar errores de almacenamiento privado
      }
    }
    return;
  }
  const normalized = slug.trim().toLowerCase();
  if (!normalized || RESERVED_TENANT_SLUGS.has(normalized)) return;
  currentTenantSlugMemory = normalized;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(ACTIVE_TENANT_STORAGE_KEY, normalized);
    } catch {
      // Ignorar errores de almacenamiento privado
    }
  }
}

export function getApiClientTenantSlug(): string | null {
  if (typeof window !== "undefined") {
    try {
      const hostname = window.location.hostname.toLowerCase();
      const pathname = window.location.pathname;

      // 1. Detección por subdominio explícito (ej: lagranjita.mesafy.com)
      const subdomain = getTenantSubdomain(hostname);
      if (subdomain && !RESERVED_TENANT_SLUGS.has(subdomain)) {
        currentTenantSlugMemory = subdomain;
        try {
          window.localStorage.setItem(ACTIVE_TENANT_STORAGE_KEY, subdomain);
        } catch {
          // Ignorar restricciones de almacenamiento
        }
        return subdomain;
      }

      // 2. Parámetros de consulta (?restaurante=..., ?marca=..., ?tenant=...)
      const params = new URLSearchParams(window.location.search);
      const queryTenant =
        params.get("restaurante")?.trim().toLowerCase() ||
        params.get("marca")?.trim().toLowerCase() ||
        params.get("tenant")?.trim().toLowerCase();

      if (queryTenant && !RESERVED_TENANT_SLUGS.has(queryTenant)) {
        currentTenantSlugMemory = queryTenant;
        try {
          window.localStorage.setItem(ACTIVE_TENANT_STORAGE_KEY, queryTenant);
        } catch {
          // Ignorar restricciones de almacenamiento
        }
        return queryTenant;
      }

      // 3. Segmento de ruta /[slug]/... (solo cuando no es una palabra reservada del sistema)
      const pathSegments = pathname
        .split("/")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

      if (
        pathSegments.length >= 1 &&
        !RESERVED_TENANT_SLUGS.has(pathSegments[0]) &&
        !pathSegments[0].includes(".")
      ) {
        const pathSlug = pathSegments[0];
        currentTenantSlugMemory = pathSlug;
        try {
          window.localStorage.setItem(ACTIVE_TENANT_STORAGE_KEY, pathSlug);
        } catch {
          // Ignorar restricciones de almacenamiento
        }
        return pathSlug;
      }

      // 4. Si la ruta es "/" en un host de plataforma, representa el directorio multimarca global
      if (pathname === "/" && isPlatformHost(hostname)) {
        return null;
      }

      // 5. En dominio personalizado (ej: pedidos.lagranjita.com) o rutas reservadas (/repartidor, /cocina)
      // consultar persistencia de sesión previa
      const stored = window.localStorage.getItem(ACTIVE_TENANT_STORAGE_KEY)?.trim().toLowerCase();
      if (stored && !RESERVED_TENANT_SLUGS.has(stored)) {
        currentTenantSlugMemory = stored;
        return stored;
      }
    } catch {
      // Usar fallback en memoria
    }
  }
  return currentTenantSlugMemory;
}

export function setApiClientAccessToken(token: string | null): void {
  currentAccessTokenMemory = token;
}

export function getApiClientAccessToken(): string | null {
  if (currentAccessTokenMemory) {
    return currentAccessTokenMemory;
  }
  if (typeof window !== "undefined") {
    try {
      const stored = window.localStorage.getItem("delivery_auth_session");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.state?.accessToken) {
          currentAccessTokenMemory = parsed.state.accessToken;
          return currentAccessTokenMemory;
        }
      }
    } catch {
      // Ignorar errores de deserialización
    }
  }
  return null;
}

