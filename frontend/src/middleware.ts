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
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  const hostname = request.headers.get("host")?.split(":")[0]?.toLowerCase();
  const response = NextResponse.next();
  if (hostname) {
    response.headers.set("x-custom-domain", hostname);
  }
  return response;
}

export const config = {
  matcher: [
    "/cocina/:path*",
    "/kitchen/:path*",
    "/admin/:path*",
    "/superadmin/:path*",
    "/driver/:path*",
    "/repartidor/:path*",
    "/active-delivery/:path*",
    "/:slug/cocina/:path*",
    "/:slug/kitchen/:path*",
    "/:slug/repartidor/:path*",
    "/:slug/active-delivery/:path*",
  ],
};

