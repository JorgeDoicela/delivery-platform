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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
  ],
};

