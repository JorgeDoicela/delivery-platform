import { NextRequest, NextResponse } from "next/server";
import { RESERVED_TENANT_SLUGS } from "@/shared/lib/tenant-context";

export async function GET(request: NextRequest) {
  const referer = request.headers.get("referer");
  let slug: string | null = null;

  if (referer) {
    try {
      const refUrl = new URL(referer);
      const segments = refUrl.pathname.split("/").filter(Boolean);
      if (segments.length > 0 && !RESERVED_TENANT_SLUGS.has(segments[0].toLowerCase())) {
        slug = segments[0];
      }
    } catch {
      // Ignorar url invalida en referer
    }
  }

  const target = slug
    ? `/images/tenants/${encodeURIComponent(slug.toLowerCase())}/identidad/logo.png`
    : "/images/platform/logo.png";

  return NextResponse.redirect(new URL(target, request.url), 307);
}
