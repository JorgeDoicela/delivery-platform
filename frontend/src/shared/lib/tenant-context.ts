export const ACTIVE_TENANT_STORAGE_KEY = "delivery_active_tenant_slug";
export const DEFAULT_TENANT_SLUG = "la-granjita";

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
  "rastreo",
  "track",
  "sucursales",
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
      const pathname = window.location.pathname;
      if (pathname === "/") {
        return null;
      }

      const params = new URLSearchParams(window.location.search);
      const queryTenant =
        params.get("restaurante")?.trim().toLowerCase() ||
        params.get("marca")?.trim().toLowerCase() ||
        params.get("tenant")?.trim().toLowerCase();

      if (queryTenant && !RESERVED_TENANT_SLUGS.has(queryTenant)) {
        currentTenantSlugMemory = queryTenant;
        window.localStorage.setItem(ACTIVE_TENANT_STORAGE_KEY, queryTenant);
        return queryTenant;
      }

      const pathSegments = pathname
        .split("/")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

      if (
        pathSegments.length === 1 &&
        !RESERVED_TENANT_SLUGS.has(pathSegments[0]) &&
        !pathSegments[0].includes(".")
      ) {
        const pathSlug = pathSegments[0];
        currentTenantSlugMemory = pathSlug;
        window.localStorage.setItem(ACTIVE_TENANT_STORAGE_KEY, pathSlug);
        return pathSlug;
      }

      if (pathSegments.length > 0 && RESERVED_TENANT_SLUGS.has(pathSegments[0])) {
        return currentTenantSlugMemory;
      }

      const stored = window.localStorage.getItem(ACTIVE_TENANT_STORAGE_KEY)?.trim().toLowerCase();
      if (stored && !RESERVED_TENANT_SLUGS.has(stored)) {
        currentTenantSlugMemory = stored;
        return stored;
      }

      const host = window.location.hostname.toLowerCase();
      const parts = host.split(".");
      if (
        parts.length > 2 &&
        parts[0] !== "www" &&
        parts[0] !== "api" &&
        !RESERVED_TENANT_SLUGS.has(parts[0])
      ) {
        currentTenantSlugMemory = parts[0];
        return parts[0];
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

