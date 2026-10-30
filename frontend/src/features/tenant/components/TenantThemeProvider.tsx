"use client";

import React, { useEffect } from "react";
import { useCartStore } from "@/features/cart";
import { useCurrentTenantQuery } from "../hooks/useTenantQueries";
import { useTenantStore } from "../store/useTenantStore";

export function TenantThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const hydrateTenantSlug = useTenantStore((s) => s.hydrateTenantSlug);
  const syncTenantContext = useCartStore((s) => s.syncTenantContext);
  const { data: tenant } = useCurrentTenantQuery();

  useEffect(() => {
    hydrateTenantSlug();
  }, [hydrateTenantSlug]);

  useEffect(() => {
    if (!tenant) return;

    const firstBranch = tenant.branches?.[0];
    syncTenantContext(
      tenant.slug,
      tenant.baseDeliveryFee ?? 1.5,
      firstBranch ? { id: firstBranch.id, name: firstBranch.name } : undefined
    );

    if (typeof document !== "undefined") {
      const root = document.documentElement;
      if (tenant.brandPrimaryColor) {
        root.style.setProperty("--brand-primary", tenant.brandPrimaryColor);
      }
      if (tenant.brandPrimaryHoverColor) {
        root.style.setProperty(
          "--brand-primary-hover",
          tenant.brandPrimaryHoverColor
        );
      }
      if (tenant.brandAccentColor) {
        root.style.setProperty("--brand-accent", tenant.brandAccentColor);
      }

      document.title = `${tenant.name} | ${tenant.tagline}`;
    }
  }, [tenant, syncTenantContext]);

  return <>{children}</>;
}
