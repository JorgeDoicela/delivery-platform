import React from "react";
import { RestaurantStorefrontView } from "@/features/tenant/components/RestaurantStorefrontView";

interface RestaurantPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: RestaurantPageProps) {
  const { slug } = await params;
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
  return <RestaurantStorefrontView initialSlug={slug} />;
}

