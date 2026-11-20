"use client";

import React, { useEffect, Suspense } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { useCurrentTenantQuery, useTenantStore, RESERVED_TENANT_SLUGS } from "@/features/tenant";
import { AuthGuard, UserRole, useAuthStore } from "@/features/auth";
import { ThemeToggle, AppHeader } from "@/shared/components";
import { useTenantRoutes } from "@/shared/lib/tenant-routing";
import { useSmartScrollHeader } from "@/shared/hooks/useSmartScrollHeader";
import { DriverBottomNav } from "./components/DriverBottomNav";

function DriverLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const rawSlug = pathname?.split("/").filter(Boolean)[0];
  const urlSlug =
    rawSlug && !RESERVED_TENANT_SLUGS.has(rawSlug.toLowerCase())
      ? rawSlug
      : undefined;

  const tenantSlug = useTenantStore((s) => s.tenantSlug);
  const setTenantSlug = useTenantStore((s) => s.setTenantSlug);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const activeTenantSlug = urlSlug || tenantSlug || user?.tenantSlug || "la-granjita";
  const routes = useTenantRoutes(activeTenantSlug);

  const handleLogout = async () => {
    await logout();
    router.push(routes.getLoginHref());
  };

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
  const brandLogo = tenant?.logoUrl || "/images/shared/placeholders/logo-default.png";
  const brandHomeHref = routes.getHomeHref();

  return (
    <AuthGuard allowedRoles={[UserRole.SuperAdmin, UserRole.Driver]}>
      <div className="flex flex-col min-h-screen bg-surface-card sm:bg-surface-canvas text-text-strong select-none transition-colors duration-200">
        <AppHeader
          isVisible={isVisible}
          isScrolled={isScrolled}
          pinOnDesktop={false}
          brand={{
            name: brandName,
            logo: brandLogo,
            href: brandHomeHref,
            subtitle: `Reparto Móvil • ${activeTenantSlug}`,
          }}
          actions={
            <>
              <ThemeToggle />
              <button
                type="button"
                onClick={handleLogout}
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
                className="p-2 sm:px-3 sm:py-1.5 rounded-full text-text-muted hover:text-red-500 hover:bg-surface-card-hover border border-surface-border transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px] font-bold uppercase tracking-wider">Salir</span>
              </button>
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
