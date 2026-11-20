"use client";

import React, { Suspense, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useCartStore } from "@/features/cart";
import { RESERVED_TENANT_SLUGS } from "../constants";
import { useCurrentTenantQuery } from "../hooks/useTenantQueries";
import { useTenantStore, getFallbackTenantConfigByDomain } from "../store/useTenantStore";
import { isPlatformHost } from "@/shared/lib/tenant-context";
import { useTenantHost } from "@/shared/lib/tenant-host-context";

function TenantThemeEffect() {
  const pathname = usePathname();
  const host = useTenantHost();
  const isPlatform = isPlatformHost(host);

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
    } else if (pathname === "/" && isPlatform) {
      setTenantSlug(null);
    } else if (!isPlatform && !activeSlug) {
      const fallback = getFallbackTenantConfigByDomain(host);
      if (fallback?.slug) {
        setTenantSlug(fallback.slug);
      }
    }
  }, [activeSlug, pathname, isPlatform, host, setTenantSlug]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;

    const effectiveTenant = tenant || (!isPlatform ? getFallbackTenantConfigByDomain(host) : null);

    if (effectiveTenant && (activeSlug || !isPlatform)) {
      const firstBranch = effectiveTenant.branches?.[0];
      syncTenantContext(
        effectiveTenant.slug,
        effectiveTenant.baseDeliveryFee ?? 1.5,
        firstBranch ? { id: firstBranch.id, name: firstBranch.name } : undefined
      );

      if (effectiveTenant.brandPrimaryColor) {
        root.style.setProperty("--brand-primary", effectiveTenant.brandPrimaryColor);
      }
      if (effectiveTenant.brandPrimaryHoverColor) {
        root.style.setProperty(
          "--brand-primary-hover",
          effectiveTenant.brandPrimaryHoverColor
        );
      }
      if (effectiveTenant.brandAccentColor) {
        root.style.setProperty("--brand-accent", effectiveTenant.brandAccentColor);
      }

      document.title = `${effectiveTenant.name} | ${effectiveTenant.tagline}`;
    } else if (pathname === "/" && isPlatform) {
      root.style.setProperty("--brand-primary", "#E4002B");
      root.style.setProperty("--brand-primary-hover", "#C40024");
      root.style.setProperty("--brand-accent", "#F59E0B");
      document.title = "Mesafy | Gestión Gastronómica, Salón & Pedidos";
    }
  }, [tenant, activeSlug, pathname, isPlatform, host, syncTenantContext]);

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
