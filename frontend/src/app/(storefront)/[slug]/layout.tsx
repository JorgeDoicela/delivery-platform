import type { Metadata } from "next";
import React from "react";
import { RESERVED_TENANT_SLUGS } from "@/shared/lib/tenant-context";
import { DynamicPwaManifest } from "@/features/tenant";

interface TenantStorefrontLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    slug: string;
  }>;
}

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

export default async function TenantStorefrontLayout({
  children,
  params,
}: TenantStorefrontLayoutProps) {
  const { slug } = await params;
  const isReserved = !slug || RESERVED_TENANT_SLUGS.has(slug.toLowerCase());

  return (
    <>
      {!isReserved && <DynamicPwaManifest slug={slug} />}
      {children}
    </>
  );
}
