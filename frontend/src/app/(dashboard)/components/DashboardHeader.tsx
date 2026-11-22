"use client";

import React from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { UserNav } from "@/features/auth";
import { TenantSwitcher } from "@/features/tenant";
import { ThemeToggle, AppHeader } from "@/shared/components";
import type { TenantRoutingResolution } from "@/shared/lib/tenant-routing";

interface DashboardHeaderProps {
  brandName: string;
  brandLogo: string;
  brandTagline?: string;
  routes: TenantRoutingResolution;
  pathname: string;
  canManageFranchise: boolean;
  isTenantAdmin?: boolean;
  isSuperAdmin: boolean;
  useKitchenWorkflow?: boolean;
  onOpenMobileMenu: () => void;
  isHeaderVisible?: boolean;
  isScrolled?: boolean;
}

export function DashboardHeader({
  brandName,
  brandLogo,
  brandTagline,
  routes,
  pathname,
  canManageFranchise,
  isTenantAdmin = false,
  isSuperAdmin,
  useKitchenWorkflow = true,
  onOpenMobileMenu,
  isHeaderVisible = true,
  isScrolled = false,
}: DashboardHeaderProps) {
  const operationsHref = useKitchenWorkflow
    ? routes.getKitchenHref()
    : routes.getMostradorHref();
  const operationsLabel = useKitchenWorkflow ? "Cocina KDS" : "Mostrador";

  const isOperationsActive =
    pathname.endsWith("/cocina") ||
    pathname.endsWith("/kitchen") ||
    pathname.endsWith("/mostrador") ||
    pathname.endsWith("/despacho");
  const isInventoryActive =
    pathname.includes("/admin/inventario") ||
    pathname.includes("/admin/inventory");
  const isBranchesActive =
    pathname.includes("/admin/sucursales") ||
    pathname.includes("/admin/branches");
  const isBrandingActive = pathname.includes("/admin/personalizacion");
  const isSuperAdminActive =
    pathname.startsWith("/superadmin") || pathname.includes("/admin/tenants");

  const hasMultipleTabs = canManageFranchise || isTenantAdmin || isSuperAdmin;

  return (
    <AppHeader
      isVisible={isHeaderVisible}
      isScrolled={isScrolled}
      pinOnDesktop={true}
      brand={{
        name: brandName,
        logo: brandLogo,
        href: operationsHref,
        tagline: brandTagline || (useKitchenWorkflow ? "Cocina KDS" : "Mostrador"),
        variant: isSuperAdmin ? "strong" : "primary",
      }}
      navigation={
        <div className="flex items-center gap-5 lg:gap-6 text-xs sm:text-sm font-display font-bold uppercase tracking-wider">
          {isSuperAdmin && (
            <Link
              href={routes.getSuperAdminHref()}
              className={`transition-colors hover:text-brand-primary ${
                isSuperAdminActive ? "text-brand-primary" : "text-text-strong"
              }`}
            >
              Marcas
            </Link>
          )}

          <Link
            href={operationsHref}
            className={`transition-colors hover:text-brand-primary ${
              isOperationsActive ? "text-brand-primary" : "text-text-strong"
            }`}
          >
            {operationsLabel}
          </Link>

          {canManageFranchise && (
            <>
              <Link
                href={routes.getAdminHref("inventario")}
                className={`transition-colors hover:text-brand-primary ${
                  isInventoryActive ? "text-brand-primary" : "text-text-strong"
                }`}
              >
                Inventario
              </Link>

              <Link
                href={routes.getAdminHref("sucursales")}
                className={`transition-colors hover:text-brand-primary ${
                  isBranchesActive ? "text-brand-primary" : "text-text-strong"
                }`}
              >
                Sucursales
              </Link>
            </>
          )}

          {(isTenantAdmin || isSuperAdmin) && (
            <Link
              href={routes.getAdminHref("personalizacion")}
              className={`transition-colors hover:text-brand-primary ${
                isBrandingActive ? "text-brand-primary" : "text-text-strong"
              }`}
            >
              Marca
            </Link>
          )}

          {hasMultipleTabs && (
            <Link
              href={routes.getHomeHref()}
              className="transition-colors text-text-strong hover:text-brand-primary"
            >
              Tienda
            </Link>
          )}
        </div>
      }
      actions={
        <>
          {isSuperAdmin && (
            <div className="hidden sm:block">
              <TenantSwitcher variant="auto" />
            </div>
          )}

          <ThemeToggle />

          <UserNav tenantSlug={routes.activeTenantSlug} showGuestLogin={false} />

          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="p-1.5 rounded-full text-text-strong hover:bg-surface-card-hover md:hidden cursor-pointer shrink-0 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Abrir navegación de operaciones"
          >
            <Menu className="w-6 h-6" />
          </button>
        </>
      }
    />
  );
}
