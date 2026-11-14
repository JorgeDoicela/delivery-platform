import type { Metadata } from "next";
import React from "react";
import { RESERVED_TENANT_SLUGS } from "@/shared/lib/tenant-context";
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

  return {
    manifest: `/manifest.json?slug=${encodeURIComponent(slug)}`,
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
