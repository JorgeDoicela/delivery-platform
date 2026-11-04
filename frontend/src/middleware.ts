import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PREFIXES = [
  "/cocina",
  "/kitchen",
  "/admin",
  "/superadmin",
  "/driver",
  "/repartidor",
];

const PLATFORM_DOMAINS = new Set([
  "localhost",
  "127.0.0.1",
  process.env.NEXT_PUBLIC_PLATFORM_DOMAIN?.toLowerCase() ?? "delivery.com",
  `www.${process.env.NEXT_PUBLIC_PLATFORM_DOMAIN?.toLowerCase() ?? "delivery.com"}`,
  "pedidos.delivery.com",
  "delivery.com",
  "www.delivery.com",
]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host")?.split(":")[0]?.toLowerCase() ?? "localhost";

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (isProtected) {
    const refreshToken =
      request.cookies.get("refresh_token") ??
      request.cookies.get("refreshToken");

    if (!refreshToken || !refreshToken.value) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Soporte de Dominio Personalizado (Custom Domain) o Subdominio de Comercio:
  // Si el host no es el dominio raíz de la plataforma ni localhost, reescribir internamente
  // la raíz '/' a la tienda aislada del comercio sin cambiar la URL visible en el navegador.
  const isCustomOrSubdomain = !PLATFORM_DOMAINS.has(hostname);
  if (isCustomOrSubdomain && pathname === "/") {
    const hostParts = hostname.split(".");
    // Si es subdominio (ej. pizzerianapoli.delivery.com)
    const subdomainSlug = hostParts.length > 2 && hostParts[0] !== "www" && hostParts[0] !== "api"
      ? hostParts[0]
      : null;

    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = `/_domain_router`;
    rewriteUrl.searchParams.set("host", hostname);
    if (subdomainSlug) {
      rewriteUrl.searchParams.set("subdomain", subdomainSlug);
    }

    const response = NextResponse.rewrite(rewriteUrl);
    response.headers.set("x-custom-domain", hostname);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/cocina/:path*",
    "/kitchen/:path*",
    "/admin/:path*",
    "/superadmin/:path*",
    "/driver/:path*",
    "/repartidor/:path*",
  ],
};

