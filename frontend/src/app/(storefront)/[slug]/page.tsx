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
      title: "No Encontrado | Mesafy",
    };
  }

  const formatted = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return {
    title: `${formatted} | Pedidos y Delivery en Línea`,
    description: `Menú en línea, especialidades recién preparadas y despacho a domicilio geolocalizado en ${formatted}.`,
  };
}

async function RestaurantStorefrontLoader({ params }: RestaurantPageProps) {
  const { slug } = await params;

  if (RESERVED_TENANT_SLUGS.has(slug.toLowerCase())) {
    notFound();
  }

  return <RestaurantStorefrontView initialSlug={slug} />;
}

export default function RestaurantPage({ params }: RestaurantPageProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-canvas" />}>
      <RestaurantStorefrontLoader params={params} />
    </Suspense>
  );
}
