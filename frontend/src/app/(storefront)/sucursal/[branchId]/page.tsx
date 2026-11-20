import React, { Suspense } from "react";
import { connection } from "next/server";
import { RestaurantStorefrontView } from "@/features/tenant/components/RestaurantStorefrontView";

interface BranchPageProps {
  params: Promise<{
    branchId: string;
  }>;
}

export async function generateMetadata({ params }: BranchPageProps) {
  await connection();
  const { branchId } = await params;
  return {
    title: `Sucursal ${branchId} | Pedidos y Delivery en Línea`,
    description: "Menú en línea, especialidades recién preparadas y despacho a domicilio.",
  };
}

async function BranchStorefrontLoader({ params }: BranchPageProps) {
  const { branchId } = await params;
  return <RestaurantStorefrontView initialBranchId={branchId} />;
}

export default function DirectBranchPage({ params }: BranchPageProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-canvas" />}>
      <BranchStorefrontLoader params={params} />
    </Suspense>
  );
}

