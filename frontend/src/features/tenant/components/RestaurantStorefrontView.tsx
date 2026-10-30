"use client";

import React, { useEffect } from "react";
import { useCurrentTenantQuery } from "@/features/tenant";
import { useTenantStore } from "@/features/tenant/store/useTenantStore";
import {
  AsaderoClassicLandingLayout,
  SteakhouseGourmetLandingLayout,
} from "@/features/tenant/layouts";

interface RestaurantStorefrontViewProps {
  initialSlug?: string;
}

export function RestaurantStorefrontView({
  initialSlug,
}: RestaurantStorefrontViewProps) {
  const setTenantSlug = useTenantStore((s) => s.setTenantSlug);
  const currentSlug = useTenantStore((s) => s.tenantSlug);

  useEffect(() => {
    if (initialSlug && initialSlug !== currentSlug) {
      setTenantSlug(initialSlug);
    }
  }, [initialSlug, currentSlug, setTenantSlug]);

  const { data: tenant } = useCurrentTenantQuery();
  const layoutTemplate = tenant?.landingLayoutTemplate ?? "asadero-clasico";

  switch (layoutTemplate) {
    case "steakhouse-gourmet":
      return <SteakhouseGourmetLandingLayout tenant={tenant} />;
    case "asadero-clasico":
    default:
      return <AsaderoClassicLandingLayout tenant={tenant} />;
  }
}

