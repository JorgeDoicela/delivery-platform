"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Utensils,
  Volume2,
  Package,
  Building2,
  Palette,
  ShieldCheck,
  Menu,
  Store,
} from "lucide-react";
import { UserNav } from "@/features/auth";
import { TenantSwitcher } from "@/features/tenant";
import { ThemeToggle } from "@/shared/components/ThemeToggle";
import type { TenantRoutingResolution } from "@/shared/lib/tenant-routing";

interface DashboardHeaderProps {
  brandName: string;
  brandLogo: string;
  routes: TenantRoutingResolution;
  pathname: string;
  canManageFranchise: boolean;
  isTenantAdmin?: boolean;
  isSuperAdmin: boolean;
  onOpenMobileMenu: () => void;
}

export function DashboardHeader({
  brandName,
  brandLogo,
  routes,
  pathname,
  canManageFranchise,
  isTenantAdmin = false,
  isSuperAdmin,
  onOpenMobileMenu,
}: DashboardHeaderProps) {
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
    <header className="h-16 bg-surface-card border-b border-surface-border px-3 sm:px-6 flex items-center justify-between shrink-0 shadow-xs transition-colors duration-200">
      <div className="flex items-center gap-3 sm:gap-6 min-w-0 shrink">
        <Link
          href={routes.getKitchenHref()}
          className="flex items-center gap-2.5 sm:gap-3 group min-w-0 shrink"
        >
          <div className="relative w-8 h-8 sm:w-9 sm:h-9 shrink-0">
            <Image
              src={brandLogo}
              alt={`Logo ${brandName}`}
              width={36}
              height={36}
              priority
              className="w-full h-full object-contain group-hover:scale-105 transition-transform"
            />
          </div>
          <div className="min-w-0">
            <span
              data-display-brand
              className="font-black text-lg sm:text-xl tracking-tight text-text-strong block leading-none uppercase font-display truncate max-w-[120px] sm:max-w-none"
            >
              {brandName}
            </span>
            <span className="text-[9px] sm:text-[10px] tracking-widest text-brand-primary font-bold uppercase block mt-0.5 truncate hidden xs:block">
              Operaciones & Cocina
            </span>
          </div>
        </Link>

        {/* Navegación Desktop */}
        <nav className="hidden md:flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider font-display">
          <Link
            href={routes.getKitchenHref()}
            className={`px-3.5 py-1.5 rounded-full transition-colors flex items-center gap-1.5 ${
              isKitchenActive
                ? "bg-brand-primary text-white shadow-xs"
                : "text-text-muted hover:text-text-strong hover:bg-surface-card-hover"
            }`}
          >
            <Utensils className="w-3.5 h-3.5 text-brand-primary group-hover:text-white" />
            <span>Cocina KDS</span>
          </Link>

          {canManageFranchise && (
            <>
              <Link
                href={routes.getAdminHref("inventario")}
                className={`px-3.5 py-1.5 rounded-full transition-colors flex items-center gap-1.5 ${
                  isInventoryActive
                    ? "bg-brand-primary text-white shadow-xs"
                    : "text-text-muted hover:text-text-strong hover:bg-surface-card-hover"
                }`}
              >
                <Package className="w-3.5 h-3.5 text-brand-accent" />
                <span>Inventario</span>
              </Link>

              <Link
                href={routes.getAdminHref("sucursales")}
                className={`px-3.5 py-1.5 rounded-full transition-colors flex items-center gap-1.5 ${
                  isBranchesActive
                    ? "bg-brand-primary text-white shadow-xs"
                    : "text-text-muted hover:text-text-strong hover:bg-surface-card-hover"
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-status-info" />
                <span>Sucursales</span>
              </Link>
            </>
          )}

          {(isTenantAdmin || isSuperAdmin) && (
            <Link
              href={routes.getAdminHref("personalizacion")}
              className={`px-3.5 py-1.5 rounded-full transition-colors flex items-center gap-1.5 ${
                isBrandingActive
                  ? "bg-brand-primary text-white shadow-xs"
                  : "text-text-muted hover:text-text-strong hover:bg-surface-card-hover"
              }`}
            >
              <Palette className="w-3.5 h-3.5 text-brand-primary" />
              <span>Marca & Landing</span>
            </Link>
          )}

          {isSuperAdmin && (
            <Link
              href={routes.getSuperAdminHref()}
              className={`px-3.5 py-1.5 rounded-full transition-colors flex items-center gap-1.5 ${
                isSuperAdminActive
                  ? "bg-brand-primary text-white shadow-xs"
                  : "text-text-muted hover:text-text-strong hover:bg-surface-card-hover"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Gobernanza de Marcas</span>
            </Link>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 text-xs shrink-0">
        {isSuperAdmin && (
          <div className="hidden sm:block">
            <TenantSwitcher variant="auto" />
          </div>
        )}

        <div className="hidden lg:flex items-center gap-1.5 text-text-muted bg-surface-canvas px-3 py-1 rounded-full border border-surface-border text-[11px] font-bold uppercase tracking-wider">
          <Volume2 className="w-3.5 h-3.5 text-brand-accent" />
          <span>Alarma</span>
        </div>

        <Link
          href={routes.getHomeHref()}
          className="text-xs font-bold uppercase tracking-wider text-text-strong hover:text-brand-primary transition-colors px-2.5 sm:px-3 py-1.5 rounded-full bg-surface-canvas hover:bg-surface-card-hover border border-surface-border font-display hidden sm:inline-flex items-center gap-1.5"
          title="Ver Tienda Pública en Vivo"
        >
          <Store className="w-3.5 h-3.5 text-brand-primary" />
          <span>Ver Tienda</span>
        </Link>

        <ThemeToggle />

        <UserNav />

        {/* Botón de Menú Móvil en pantallas < md */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="p-1.5 rounded-full text-text-strong hover:bg-surface-card-hover md:hidden cursor-pointer shrink-0 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Abrir navegación de operaciones"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
}
