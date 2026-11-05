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

  const setTenantSlug = useTenantStore((s) => s.setTenantSlug);
  const syncTenantContext = useCartStore((s) => s.syncTenantContext);
  const { data: tenant } = useCurrentTenantQuery(activeSlug);

  useEffect(() => {
    if (activeSlug) {
      setTenantSlug(activeSlug);
    } else if (pathname === "/") {
      setTenantSlug(null);
    }
  }, [activeSlug, pathname, setTenantSlug]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;

    if (tenant && activeSlug) {
      const firstBranch = tenant.branches?.[0];
      syncTenantContext(
        tenant.slug,
        tenant.baseDeliveryFee ?? 1.5,
        firstBranch ? { id: firstBranch.id, name: firstBranch.name } : undefined
      );

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
    } else if (pathname === "/") {
      root.style.setProperty("--brand-primary", "#E4002B");
      root.style.setProperty("--brand-primary-hover", "#C40024");
      root.style.setProperty("--brand-accent", "#F59E0B");
      document.title = "Mesafy | Gestión Gastronómica, Salón & Pedidos";
    }
  }, [tenant, activeSlug, pathname, syncTenantContext]);

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
