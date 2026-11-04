"use client";

import React, { Suspense, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useCartStore } from "@/features/cart";
import { RESERVED_TENANT_SLUGS } from "../constants";
import { useCurrentTenantQuery } from "../hooks/useTenantQueries";
import { useTenantStore } from "../store/useTenantStore";

function TenantThemeEffect() {
  const pathname = usePathname();
  const rawSlug = pathname?.split("/").filter(Boolean)[0];
  const activeSlug =
    rawSlug && !RESERVED_TENANT_SLUGS.has(rawSlug.toLowerCase())
      ? rawSlug
      : undefined;

  const hydrateTenantSlug = useTenantStore((s) => s.hydrateTenantSlug);
  const setTenantSlug = useTenantStore((s) => s.setTenantSlug);
  const syncTenantContext = useCartStore((s) => s.syncTenantContext);
  const { data: tenant } = useCurrentTenantQuery(activeSlug);

  useEffect(() => {
    hydrateTenantSlug();
    if (activeSlug) {
      setTenantSlug(activeSlug);
    }
  }, [hydrateTenantSlug, activeSlug, setTenantSlug]);

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

  return null;
}

export function TenantThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense fallback={null}>
        <TenantThemeEffect />
      </Suspense>
      {children}
    </>
  );
}
