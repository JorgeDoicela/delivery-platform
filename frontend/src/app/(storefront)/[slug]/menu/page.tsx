import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import { RestaurantDedicatedMenuView } from "@/features/tenant";
import { RESERVED_TENANT_SLUGS } from "@/features/tenant/constants";

interface RestaurantMenuPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: RestaurantMenuPageProps) {
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
    title: `Carta y Menú Completo | ${formatted}`,
    description: `Explora la carta completa, combos, porciones y especialidades de ${formatted} con despacho a domicilio en tiempo real.`,
  };
}

async function RestaurantMenuLoader({ params }: RestaurantMenuPageProps) {
  const { slug } = await params;

  if (RESERVED_TENANT_SLUGS.has(slug.toLowerCase())) {
    notFound();
  }

  return <RestaurantDedicatedMenuView initialSlug={slug} />;
}

export default function RestaurantMenuPage({ params }: RestaurantMenuPageProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-canvas" />}>
      <RestaurantMenuLoader params={params} />
    </Suspense>
  );
}

