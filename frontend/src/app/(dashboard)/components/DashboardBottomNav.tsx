"use client";

import React from "react";
import Link from "next/link";
import {
  Utensils,
  Package,
  Building2,
  Palette,
  ShieldCheck,
  Store,
} from "lucide-react";
import type { TenantRoutingResolution } from "@/shared/lib/tenant-routing";

interface DashboardBottomNavProps {
  routes: TenantRoutingResolution;
  pathname: string;
  canManageFranchise: boolean;
  isTenantAdmin?: boolean;
  isSuperAdmin: boolean;
  isBottomNavVisible: boolean;
}

export function DashboardBottomNav({
  routes,
  pathname,
  canManageFranchise,
  isTenantAdmin = false,
  isSuperAdmin,
  isBottomNavVisible,
}: DashboardBottomNavProps) {
  const isKitchenActive =
    pathname.endsWith("/cocina") || pathname.endsWith("/kitchen");
  const isInventoryActive =
    pathname.includes("/admin/inventario") ||
    pathname.includes("/admin/inventory");
  const isBranchesActive =
    pathname.includes("/admin/sucursales") ||
    pathname.includes("/admin/branches");
  const isBrandingActive = pathname.includes("/admin/personalizacion");
  const isSuperAdminActive =
    pathname.startsWith("/superadmin") || pathname.includes("/admin/tenants");

  return (
    <nav
      aria-label="Navegación móvil de operaciones"
      className={`fixed bottom-0 left-0 right-0 z-30 bg-surface-card/95 backdrop-blur-md border-t border-surface-border px-1.5 py-1.5 flex items-center justify-around md:hidden shadow-lg select-none transition-all duration-300 ease-in-out ${
        isBottomNavVisible
          ? "translate-y-0 opacity-100 pointer-events-auto"
          : "translate-y-full opacity-0 pointer-events-none"
      }`}
      style={{ paddingBottom: "max(0.4rem, env(safe-area-inset-bottom))" }}
    >
      <Link
        href={routes.getKitchenHref()}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-bold font-display uppercase tracking-wider transition-colors min-w-[50px] min-h-[44px] ${
          isKitchenActive
            ? "text-brand-primary"
            : "text-text-muted hover:text-text-strong"
        }`}
      >
        <Utensils className="w-5 h-5 mb-0.5" />
        <span>KDS</span>
      </Link>

      {canManageFranchise && (
        <>
          <Link
            href={routes.getAdminHref("inventario")}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-bold font-display uppercase tracking-wider transition-colors min-w-[50px] min-h-[44px] ${
              isInventoryActive
                ? "text-brand-primary"
                : "text-text-muted hover:text-text-strong"
            }`}
          >
            <Package className="w-5 h-5 mb-0.5" />
            <span>Stock</span>
          </Link>

          <Link
            href={routes.getAdminHref("sucursales")}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-bold font-display uppercase tracking-wider transition-colors min-w-[50px] min-h-[44px] ${
              isBranchesActive
                ? "text-brand-primary"
                : "text-text-muted hover:text-text-strong"
            }`}
          >
            <Building2 className="w-5 h-5 mb-0.5" />
            <span>Locales</span>
          </Link>
        </>
      )}

      {(isTenantAdmin || isSuperAdmin) && (
        <Link
          href={routes.getAdminHref("personalizacion")}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-bold font-display uppercase tracking-wider transition-colors min-w-[50px] min-h-[44px] ${
            isBrandingActive
              ? "text-brand-primary"
              : "text-text-muted hover:text-text-strong"
          }`}
        >
          <Palette className="w-5 h-5 mb-0.5" />
          <span>Marca</span>
        </Link>
      )}

      {isSuperAdmin && (
        <Link
          href={routes.getSuperAdminHref()}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-bold font-display uppercase tracking-wider transition-colors min-w-[50px] min-h-[44px] ${
            isSuperAdminActive
              ? "text-brand-primary"
              : "text-text-muted hover:text-text-strong"
          }`}
        >
          <ShieldCheck className="w-5 h-5 mb-0.5" />
          <span>Admin</span>
        </Link>
      )}

      <Link
        href={routes.getHomeHref()}
        className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-bold font-display uppercase tracking-wider text-text-muted hover:text-text-strong transition-colors min-w-[50px] min-h-[44px]"
      >
        <Store className="w-5 h-5 mb-0.5" />
        <span>Tienda</span>
      </Link>
    </nav>
  );
}
