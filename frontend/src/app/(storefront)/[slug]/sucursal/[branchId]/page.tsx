import type { Metadata } from "next";
import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import { RestaurantStorefrontView } from "@/features/tenant/components/RestaurantStorefrontView";
import { RESERVED_TENANT_SLUGS } from "@/shared/lib/tenant-context";

interface BranchPageProps {
  params: Promise<{
    slug: string;
    branchId: string;
  }>;
}

export const metadata: Metadata = {
  title: "Sucursal | Pedidos y Delivery",
  description:
    "Menú en línea, especialidades recién preparadas y despacho a domicilio.",
};

async function BranchStorefrontLoader({ params }: BranchPageProps) {
  const { slug, branchId } = await params;

  if (RESERVED_TENANT_SLUGS.has(slug.toLowerCase())) {
    notFound();
  }

  return (
    <RestaurantStorefrontView
      initialSlug={slug}
      initialBranchId={branchId}
    />
  );
}

export default function TenantBranchPage({ params }: BranchPageProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-canvas" />}>
      <BranchStorefrontLoader params={params} />
    </Suspense>
  );
}

