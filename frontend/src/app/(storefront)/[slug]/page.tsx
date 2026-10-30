import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import { RestaurantStorefrontView } from "@/features/tenant/components/RestaurantStorefrontView";
import { RESERVED_TENANT_SLUGS } from "@/features/tenant/constants";

interface RestaurantPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: RestaurantPageProps) {
  const { slug } = await params;
  if (RESERVED_TENANT_SLUGS.has(slug.toLowerCase())) {
    return {
      title: "No Encontrado | Delivery Platform",
    };
  }

  const formatted = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return {
    title: `${formatted} | Pedidos y Delivery en Línea`,
    description: `Menú en línea, combos asados a la brasa y despacho a domicilio geolocalizado en ${formatted}.`,
  };
}

export default async function RestaurantPage({ params }: RestaurantPageProps) {
  const { slug } = await params;

  if (RESERVED_TENANT_SLUGS.has(slug.toLowerCase())) {
    notFound();
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-canvas" />}>
      <RestaurantStorefrontView initialSlug={slug} />
    </Suspense>
  );
}
