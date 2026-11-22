"use client";

import React, { useEffect, Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentTenantQuery, useTenantStore, RESERVED_TENANT_SLUGS } from "@/features/tenant";
import { AuthGuard, UserRole, useAuthStore, UserNav } from "@/features/auth";
import { ThemeToggle, AppHeader } from "@/shared/components";
import { useTenantRoutes } from "@/shared/lib/tenant-routing";
import { useSmartScrollHeader } from "@/shared/hooks/useSmartScrollHeader";
import { DriverBottomNav } from "./components/DriverBottomNav";

function DriverLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const rawSlug = pathname?.split("/").filter(Boolean)[0];
  const urlSlug =
    rawSlug && !RESERVED_TENANT_SLUGS.has(rawSlug.toLowerCase())
      ? rawSlug
      : undefined;

  const tenantSlug = useTenantStore((s) => s.tenantSlug);
  const setTenantSlug = useTenantStore((s) => s.setTenantSlug);
  const user = useAuthStore((s) => s.user);

  const activeTenantSlug = urlSlug || tenantSlug || user?.tenantSlug || "la-granjita";
  const routes = useTenantRoutes(activeTenantSlug);

  useEffect(() => {
    if (activeTenantSlug && activeTenantSlug !== tenantSlug) {
      setTenantSlug(activeTenantSlug);
    }
  }, [activeTenantSlug, tenantSlug, setTenantSlug]);

  const { isVisible, isScrolled } = useSmartScrollHeader({
    threshold: 15,
    pinThreshold: 76,
  });

  const { data: tenant } = useCurrentTenantQuery(activeTenantSlug);
  const brandName = tenant?.name || user?.tenantName || "Restaurante";
  const brandTagline = tenant?.tagline || "Restaurante & Delivery";
  const brandLogo = tenant?.logoUrl || "/images/shared/placeholders/logo-default.png";
  const driverHref = routes.getDriverHref();
  const isDriverActive = pathname?.includes("/repartidor");

  return (
    <AuthGuard allowedRoles={[UserRole.SuperAdmin, UserRole.Driver]}>
      <div className="flex flex-col min-h-screen bg-surface-card sm:bg-surface-canvas text-text-strong select-none transition-colors duration-200">
        <AppHeader
          isVisible={isVisible}
          isScrolled={isScrolled}
          pinOnDesktop={true}
          brand={{
            name: brandName,
            logo: brandLogo,
            href: driverHref,
            tagline: brandTagline,
            variant: "primary",
          }}
          navigation={
            <div className="flex items-center gap-5 lg:gap-6 text-xs sm:text-sm font-display font-bold uppercase tracking-wider">
              <Link
                href={driverHref}
                className={`transition-colors hover:text-brand-primary ${
                  isDriverActive ? "text-brand-primary" : "text-text-strong"
                }`}
              >
                Reparto
              </Link>
            </div>
          }
          actions={
            <>
              <ThemeToggle />
              <UserNav tenantSlug={activeTenantSlug} showGuestLogin={false} />
            </>
          }
        />

        <main className="flex-1 w-full px-4 py-3 sm:p-6 flex flex-col bg-surface-card sm:bg-surface-canvas pb-24 sm:pb-6 transition-colors duration-200">
          {children}
        </main>

        <DriverBottomNav isVisible={isVisible} />
      </div>
    </AuthGuard>
  );
}

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-canvas" />}>
      <DriverLayoutContent>{children}</DriverLayoutContent>
    </Suspense>
  );
}
