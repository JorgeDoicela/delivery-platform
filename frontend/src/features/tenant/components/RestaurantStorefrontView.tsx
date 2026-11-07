"use client";

import React, { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useCurrentTenantQuery } from "@/features/tenant";
import { useTenantStore } from "@/features/tenant/store/useTenantStore";
import { useCartStore } from "@/features/cart";
import {
  AsaderoClassicLandingLayout,
  SteakhouseGourmetLandingLayout,
  FastCasualUrbanLandingLayout,
} from "@/features/tenant/layouts";

interface RestaurantStorefrontViewProps {
  initialSlug?: string;
  initialBranchId?: number | string;
}

function BranchSync({
  initialBranchId,
  branches,
}: {
  initialBranchId?: number | string;
  branches: Array<{ id: number; name: string }>;
}) {
  const searchParams = useSearchParams();
  const queryBranch = searchParams?.get("branch") || searchParams?.get("sucursal");
  const setBranch = useCartStore((s) => s.setBranch);
  const currentBranchId = useCartStore((s) => s.branchId);

  useEffect(() => {
    const branchToApply = initialBranchId || queryBranch;
    if (branchToApply && branches.length > 0) {
      const targetId = Number(branchToApply);
      const found = branches.find(
        (b) =>
          b.id === targetId ||
          b.name.toLowerCase().includes(String(branchToApply).toLowerCase())
      );
      if (found && found.id !== currentBranchId) {
        setBranch(found.id, found.name);
      }
    }
  }, [initialBranchId, queryBranch, branches, currentBranchId, setBranch]);

  return null;
}

export function RestaurantStorefrontView({
  initialSlug,
  initialBranchId,
}: RestaurantStorefrontViewProps) {
  const setTenantSlug = useTenantStore((s) => s.setTenantSlug);
  const currentSlug = useTenantStore((s) => s.tenantSlug);

  useEffect(() => {
    if (initialSlug && initialSlug !== currentSlug) {
      setTenantSlug(initialSlug);
    }
  }, [initialSlug, currentSlug, setTenantSlug]);

  const { data: tenant } = useCurrentTenantQuery(initialSlug);
  const branches = tenant?.branches ?? [];
  const layoutTemplate = tenant?.landingLayoutTemplate ?? "asadero-clasico";

  const renderLayout = () => {
    switch (layoutTemplate) {
      case "steakhouse-gourmet":
        return <SteakhouseGourmetLandingLayout tenant={tenant} />;
      case "fast-casual-urbano":
        return <FastCasualUrbanLandingLayout tenant={tenant} />;
      case "asadero-clasico":
      default:
        return <AsaderoClassicLandingLayout tenant={tenant} />;
    }
  };

  return (
    <>
      <Suspense fallback={null}>
        <BranchSync initialBranchId={initialBranchId} branches={branches} />
      </Suspense>
      {renderLayout()}
    </>
  );
}
