import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const OPERATIONAL_KEYWORDS = new Set([
  "cocina",
  "kitchen",
  "admin",
  "superadmin",
  "driver",
  "repartidor",
  "active-delivery",
]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const segments = pathname.split("/").filter(Boolean);

  const isProtected = segments.some((seg) =>
    OPERATIONAL_KEYWORDS.has(seg.toLowerCase())
  );

  if (isProtected) {
    const refreshToken =
      request.cookies.get("refresh_token") ??
      request.cookies.get("refreshToken");

    if (!refreshToken || !refreshToken.value) {
      // Si la ruta contiene un prefijo de slug de tenant (ej: /la-granjita/cocina o /la-granjita/admin/personalizacion)
      // redirige nativamente a la pantalla de login del tenant (/la-granjita/login)
      const isTenantPrefixed =
        segments.length >= 2 &&
        !OPERATIONAL_KEYWORDS.has(segments[0].toLowerCase()) &&
        OPERATIONAL_KEYWORDS.has(segments[1].toLowerCase());

      const loginPath = isTenantPrefixed ? `/${segments[0]}/login` : "/login";
      const loginUrl = new URL(loginPath, request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  const rawHost =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host");
  const hostname = rawHost?.split(":")[0]?.toLowerCase();

  const requestHeaders = new Headers(request.headers);
  if (hostname) {
    requestHeaders.set("x-tenant-host", hostname);
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  if (hostname) {
    response.headers.set("x-custom-domain", hostname);
  }
  return response;
}

export const config = {
  matcher: [
    /*
     * Intercepta todas las rutas excepto:
     * - _next/static (archivos estáticos compilados)
     * - _next/image (optimización de imágenes)
     * - favicon.ico, sitemap.xml, robots.txt
     * - imágenes públicas (/images/*)
     * - archivos PWA (sw.js, manifest.webmanifest)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|images|sw.js|manifest.webmanifest).*)",
  ],
};
