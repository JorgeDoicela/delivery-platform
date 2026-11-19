import type { Metadata } from "next";
import React from "react";
import { RESERVED_TENANT_SLUGS } from "@/shared/lib/tenant-context";
import { FALLBACK_TENANT_CONFIGS } from "@/features/tenant/store/useTenantStore";
import { DynamicPwaManifest } from "@/features/tenant";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!slug || RESERVED_TENANT_SLUGS.has(slug.toLowerCase())) {
    return {};
  }

  const normalizedSlug = slug.toLowerCase();
  const fallback = FALLBACK_TENANT_CONFIGS[normalizedSlug];
  const logoUrl =
    fallback?.logoUrl ||
    `/images/tenants/${encodeURIComponent(normalizedSlug)}/identidad/logo.png`;

  return {
    manifest: `/manifest.json?slug=${encodeURIComponent(normalizedSlug)}`,
    icons: {
      icon: [
        {
          url: logoUrl,
          type: "image/png",
        },
      ],
      apple: logoUrl,
      shortcut: logoUrl,
    },
  };
}

export default function TenantStorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <React.Suspense fallback={null}>
        <DynamicPwaManifest />
      </React.Suspense>
      {children}
    </>
  );
}
