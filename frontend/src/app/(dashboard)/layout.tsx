"use client";

import React, { useEffect, useState, Suspense } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore, UserRole, AuthGuard } from "@/features/auth";
import { useCurrentTenantQuery, useTenantStore, RESERVED_TENANT_SLUGS } from "@/features/tenant";
import { useSmartScrollHeader } from "@/shared/hooks/useSmartScrollHeader";
import { useTenantRoutes } from "@/shared/lib/tenant-routing";
import { DashboardHeader } from "./components/DashboardHeader";
import { DashboardMobileDrawer } from "./components/DashboardMobileDrawer";
import { DashboardBottomNav } from "./components/DashboardBottomNav";

function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isVisible: isBottomNavVisible } = useSmartScrollHeader({
    threshold: 15,
    pinThreshold: 76,
  });

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

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setIsMobileMenuOpen(false);
  }

  const { data: tenant } = useCurrentTenantQuery(activeTenantSlug);
  const isSuperAdmin = Boolean(
    user &&
      (user.role === "SuperAdmin" ||
        user.role === UserRole.SuperAdmin ||
        user.roles?.includes("SuperAdmin") ||
        Number(user.role) === 1)
  );

  const isTenantAdmin = Boolean(
    user &&
      (user.role === "TenantAdmin" ||
        user.role === UserRole.TenantAdmin ||
        user.roles?.includes("TenantAdmin") ||
        Number(user.role) === 2)
  );

  const canManageFranchise =
    isSuperAdmin ||
    isTenantAdmin ||
    Boolean(
      user &&
        (user.role === "BranchManager" ||
          user.role === UserRole.BranchManager ||
          user.roles?.includes("BranchManager") ||
          Number(user.role) === 3)
    );

  const brandName = tenant?.name || "La Granjita";
  const brandLogo = tenant?.logoUrl || "/images/shared/placeholders/logo-default.png";
  const storefrontHref = `/${tenant?.slug || activeTenantSlug || "la-granjita"}`;

  return (
    <AuthGuard
      allowedRoles={[
        UserRole.SuperAdmin,
        UserRole.TenantAdmin,
        UserRole.BranchManager,
        UserRole.Cashier,
        UserRole.KitchenStaff,
      ]}
    >
      <div className="flex flex-col min-h-screen bg-surface-canvas text-text-strong transition-colors duration-200">
        <DashboardHeader
          brandName={brandName}
          brandLogo={brandLogo}
          routes={routes}
          pathname={pathname}
          canManageFranchise={canManageFranchise}
          isTenantAdmin={isTenantAdmin}
          isSuperAdmin={isSuperAdmin}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        <DashboardMobileDrawer
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          brandName={brandName}
          brandLogo={brandLogo}
          isSuperAdmin={isSuperAdmin}
          storefrontHref={storefrontHref}
        />

        <main className="flex-1 p-3.5 sm:p-6 overflow-y-auto overflow-x-hidden flex flex-col bg-surface-canvas transition-colors duration-200 pb-24 md:pb-6">
          {children}
        </main>

        <DashboardBottomNav
          routes={routes}
          pathname={pathname}
          canManageFranchise={canManageFranchise}
          isTenantAdmin={isTenantAdmin}
          isSuperAdmin={isSuperAdmin}
          isBottomNavVisible={isBottomNavVisible}
        />
      </div>
    </AuthGuard>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-canvas" />}>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  );
}
