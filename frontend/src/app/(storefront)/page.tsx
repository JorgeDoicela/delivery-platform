"use client";

import React from "react";
import { useCurrentTenantQuery } from "@/features/tenant";
import {
  AsaderoClassicLandingLayout,
  SteakhouseGourmetLandingLayout,
} from "@/features/tenant/layouts";

export default function StorefrontHomePage() {
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

