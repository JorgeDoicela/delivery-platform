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
  "www.mesafy.doicela.dev",
  "platform.mesafy.com",
]);

export const PLATFORM_BASE_DOMAINS = [
  "mesafy.com",
  "mesafy.app",
  "mesafy.dev",
  "mesafy.doicela.dev",
];

if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_PLATFORM_DOMAIN) {
  const envDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN.toLowerCase().trim();
  if (envDomain) {
    PLATFORM_HOSTS.add(envDomain);
    PLATFORM_HOSTS.add(`www.${envDomain}`);
    if (!PLATFORM_BASE_DOMAINS.includes(envDomain)) {
      PLATFORM_BASE_DOMAINS.push(envDomain);
    }
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

  // Un subdominio solo pertenece a la plataforma si el dominio padre es un host base de Mesafy
  const isPlatformSub = PLATFORM_BASE_DOMAINS.some((base) =>
    cleanHost.endsWith(`.${base}`)
  );
  if (!isPlatformSub) {
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

export function getApiClientTenantDomain(hostname?: string): string | null {
  let host = hostname;
  if (!host && typeof window !== "undefined") {
    host = window.location.hostname;
  }
  if (!host) return null;
  const clean = host.split(":")[0].toLowerCase().trim();
  if (!isPlatformHost(clean) && !getTenantSubdomain(clean)) {
    return clean;
  }
  return null;
}

export const RESERVED_TENANT_SLUGS = new Set([
  "admin",
  "superadmin",
  "api",
  "login",
  "registro",
  "register",
  "cuenta",
  "account",
  "perfil",
  "profile",
  "menu",
  "carta",
  "checkout",
  "catalogo",
  "finalizar-pedido",
  "cocina",
  "kitchen",
  "mostrador",
  "despacho",
  "repartidor",
  "active-delivery",
  "pedidos",
  "mis-pedidos",
  "orders",
  "rastreo",
  "track",
  "tracking",
  "sucursales",
  "sucursal",
  "locales",
  "terminos",
  "privacidad",
  "terms",
  "privacy",
  "recuperar-clave",
  "restablecer-clave",
  "forgot-password",
  "reset-password",
  "verificar-correo",
  "verify-email",
  "static",
  "assets",
  "health",
  "hub",
  "hubs",
  "ws",
  "auth",
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

      // 3. Segmento de ruta /[slug]/... (solo cuando estamos en host de plataforma y no es una palabra reservada)
      const pathSegments = pathname
        .split("/")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

      if (
        isPlatformHost(hostname) &&
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

      // 4. Si estamos en un host de plataforma (mesafy.doicela.dev, localhost):
      // Si la ruta corresponde a la gobernanza global o cuenta del usuario (/, /login, /registro, /cuenta, /superadmin):
      // Retornar null para que la sesión y peticiones pertenezcan al contexto global y no secuestren la plataforma.
      const firstSegment = pathSegments[0] || "";
      const isPlatformGlobalRoute =
        !firstSegment ||
        firstSegment === "login" ||
        firstSegment === "registro" ||
        firstSegment === "register" ||
        firstSegment === "cuenta" ||
        firstSegment === "account" ||
        firstSegment === "perfil" ||
        firstSegment === "superadmin" ||
        firstSegment === "terminos" ||
        firstSegment === "privacidad" ||
        firstSegment === "terms" ||
        firstSegment === "privacy";

      if (isPlatformHost(hostname) && isPlatformGlobalRoute) {
        return null;
      }

      // 5. En dominio personalizado (ej: asaderolagranjita.doicela.dev, pedidos.lagranjita.com)
      if (!isPlatformHost(hostname)) {
        if (hostname.includes("lagranjita") || hostname.includes("granjita") || hostname.includes("asadero")) {
          currentTenantSlugMemory = "la-granjita";
          return "la-granjita";
        }
        if (hostname.includes("brasas") || hostname.includes("valle")) {
          currentTenantSlugMemory = "brasas-del-valle";
          return "brasas-del-valle";
        }
      }

      // 6. Consultar persistencia de sesión previa (limpiando slugs corruptos/reservados)
      const stored = window.localStorage.getItem(ACTIVE_TENANT_STORAGE_KEY)?.trim().toLowerCase();
      if (stored) {
        if (RESERVED_TENANT_SLUGS.has(stored)) {
          try {
            window.localStorage.removeItem(ACTIVE_TENANT_STORAGE_KEY);
          } catch {
            // Ignorar
          }
        } else {
          currentTenantSlugMemory = stored;
          return stored;
        }
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

