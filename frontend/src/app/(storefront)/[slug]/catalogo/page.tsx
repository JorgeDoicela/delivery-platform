import type { Metadata } from "next";
import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import { CatalogSection } from "@/features/catalog";
import { RESERVED_TENANT_SLUGS } from "@/shared/lib/tenant-context";
import { Loader2 } from "lucide-react";

interface TenantCatalogPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const metadata: Metadata = {
  title: "Menú y Catálogo",
  description: "Catálogo de especialidades y combos.",
};

async function TenantCatalogLoader({ params }: TenantCatalogPageProps) {
  const { slug } = await params;
  if (RESERVED_TENANT_SLUGS.has(slug.toLowerCase())) {
    notFound();
  }
  return <CatalogSection tenantSlug={slug} />;
}

export default function TenantCatalogPage({ params }: TenantCatalogPageProps) {
  return (
    <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-8 lg:px-12 py-8 space-y-8">
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center min-h-[40vh] text-text-muted gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Cargando catálogo...
            </span>
          </div>
        }
      >
        <TenantCatalogLoader params={params} />
      </Suspense>
    </div>
  );
}
