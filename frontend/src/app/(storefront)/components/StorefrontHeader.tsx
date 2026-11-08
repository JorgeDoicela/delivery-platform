"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Search,
  User,
  Menu,
  LayoutDashboard,
} from "lucide-react";
import { CartButtonBadge } from "@/features/cart";
import {
  RESERVED_TENANT_SLUGS,
  TenantBranchSelector,
  TenantSwitcher,
  useCurrentTenantQuery,
} from "@/features/tenant";
import { useAuthStore, UserRole, isUserInRole } from "@/features/auth";
import { ThemeToggle } from "@/shared/components/ThemeToggle";
import { StorefrontMobileDrawer } from "./StorefrontMobileDrawer";
import { useSmartScrollHeader } from "@/shared/hooks/useSmartScrollHeader";
import { useTenantRoutes } from "@/shared/lib/tenant-routing";

export function StorefrontHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isVisible, isScrolled, setIsVisible } = useSmartScrollHeader({
    threshold: 15,
    pinThreshold: 76,
  });

  const pathname = usePathname();
  const rawSlug = pathname?.split("/").filter(Boolean)[0];
  const activeSlug =
    rawSlug && !RESERVED_TENANT_SLUGS.has(rawSlug.toLowerCase())
      ? rawSlug
      : undefined;
  const { data: tenant } = useCurrentTenantQuery(activeSlug);
  const routes = useTenantRoutes(activeSlug || tenant?.slug);

  const isPlatformRoot = routes.isPlatformRoot;
  const brandHomeHref = routes.getHomeHref();
  const catalogHref = routes.getCatalogHref();
  const brandName = isPlatformRoot
    ? "MESAFY"
    : tenant?.name || "Restaurante Asociado";
  const brandTagline = isPlatformRoot
    ? "TECNOLOGÍA GASTRONÓMICA & PEDIDOS DIRECTOS"
    : tenant?.tagline || "Restaurante & Delivery";
  const brandLogo = isPlatformRoot
    ? "/images/platform/logo.png"
    : tenant?.logoUrl || "/images/shared/placeholders/logo-default.png";

  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);

  const isSuperAdmin = isUserInRole(user, UserRole.SuperAdmin);
  const isTenantAdmin = isUserInRole(user, UserRole.TenantAdmin);
  const isBranchManager = isUserInRole(user, UserRole.BranchManager);
  const isKitchenStaff = isUserInRole(user, UserRole.KitchenStaff);
  const isCashier = isUserInRole(user, UserRole.Cashier);
  const isDriver = isUserInRole(user, UserRole.Driver);

  const operationalHref = isSuperAdmin
    ? routes.getSuperAdminHref()
    : isTenantAdmin
      ? routes.getAdminHref("personalizacion")
      : isBranchManager
        ? routes.getAdminHref("inventario")
        : isKitchenStaff || isCashier
          ? routes.getKitchenHref()
          : isDriver
            ? routes.getDriverHref()
            : null;

  const operationalLabel = isSuperAdmin
    ? "SuperAdmin"
    : isTenantAdmin
      ? "Administración"
      : isBranchManager
        ? "Gestión Local"
        : isKitchenStaff || isCashier
          ? "Cocina KDS"
          : isDriver
            ? "Repartidor"
            : null;

  // Cerrar menú móvil al navegar
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setIsMobileMenuOpen(false);
  }

  // Bloquear scroll cuando el drawer móvil esté abierto
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <header
        onFocus={() => setIsVisible(true)}
        className={`sticky top-0 z-40 bg-surface-card border-b border-surface-border will-change-transform transition-all duration-300 ease-in-out ${
          isVisible
            ? "translate-y-0 opacity-100"
            : "-translate-y-full opacity-0 pointer-events-none"
        } ${
          isScrolled
            ? "shadow-md bg-surface-card/95 backdrop-blur-md"
            : "shadow-xs"
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-[66px] sm:h-[76px] flex items-center justify-between gap-2 sm:gap-6">
          <div className="flex items-center gap-4 lg:gap-7 min-w-0 shrink">
            <Link href={brandHomeHref} className="flex items-center gap-2 sm:gap-2.5 group min-w-0 shrink">
              <div className="relative w-8 h-8 sm:w-10 sm:h-10 shrink-0">
                <Image
                  src={brandLogo}
                  alt={`Logo ${brandName}`}
                  width={40}
                  height={40}
                  priority
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <span
                  data-display-brand
                  className="font-black text-xl sm:text-[26px] tracking-tight text-brand-primary block leading-none uppercase font-display truncate max-w-[130px] sm:max-w-none"
                  suppressHydrationWarning
                >
                  {brandName}
                </span>
                <span
                  className="text-[9px] sm:text-[10px] tracking-widest text-text-muted font-bold uppercase block mt-0.5 truncate hidden xs:block"
                  suppressHydrationWarning
                >
                  {brandTagline}
                </span>
              </div>
            </Link>

            <nav className="hidden xl:flex items-center gap-6 text-[13px] sm:text-sm font-semibold text-text-strong">
              <Link
                href={catalogHref}
                className="hover:text-brand-primary transition-colors"
              >
                {isPlatformRoot ? "Restaurantes" : "Menú & Combos"}
              </Link>
              <Link
                href={routes.getRastreoHref()}
                className="hover:text-brand-primary transition-colors"
              >
                Rastrear Pedido
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* El conmutador multi-marca solo se expone en la landing de la plataforma (/); en la tienda del restaurante se ofrece el selector de sucursales */}
            <div className="hidden sm:block">
              {isPlatformRoot ? (
                <TenantSwitcher variant="auto" />
              ) : (
                <TenantBranchSelector tenant={tenant} />
              )}
            </div>

            <div className="hidden lg:flex items-center">
              <Link
                href={catalogHref}
                className="flex items-center gap-2.5 px-4 py-2 w-48 xl:w-64 bg-surface-canvas hover:bg-surface-card-hover rounded-full transition-colors border border-surface-border text-text-muted group"
              >
                <Search className="w-4 h-4 text-text-muted group-hover:text-brand-primary transition-colors shrink-0" />
                <span className="text-xs sm:text-sm text-text-muted font-normal truncate">
                  {isPlatformRoot ? "Buscar restaurantes..." : `Buscar en ${brandName}...`}
                </span>
              </Link>
            </div>

            <ThemeToggle />

            {operationalHref && (
              <Link
                href={operationalHref}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white text-[11px] font-bold uppercase tracking-wider font-display transition-colors shadow-xs"
                title={`Acceder a ${operationalLabel}`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-brand-primary" />
                <span>{operationalLabel}</span>
              </Link>
            )}

            <Link
              href={routes.getLoginHref()}
              className="hidden sm:flex flex-col items-center justify-center text-text-strong hover:text-brand-primary transition-colors px-1 shrink-0 relative"
              title={isAuthenticated ? `Sesión iniciada: ${user?.fullName}` : "Mi Perfil / Iniciar Sesión"}
            >
              <div className="relative">
                <User className="w-5 h-5 text-text-strong stroke-[1.8]" />
                {isAuthenticated && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-white dark:border-neutral-900" />
                )}
              </div>
              <span className="text-[10px] font-semibold text-text-muted leading-none mt-1">
                {isAuthenticated ? "Mi Cuenta" : "Perfil"}
              </span>
            </Link>

            <CartButtonBadge />

            {/* Disparador de Menú Móvil en pantallas < xl */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1.5 sm:p-2 rounded-full text-text-strong hover:bg-surface-card-hover xl:hidden cursor-pointer shrink-0 transition-colors"
              aria-label="Abrir menú de navegación"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Drawer Deslizante Móvil Modularizado */}
      <StorefrontMobileDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        brandName={brandName}
        brandTagline={brandTagline}
        brandLogo={brandLogo}
        isPlatformRoot={isPlatformRoot}
        routes={routes}
        catalogHref={catalogHref}
        tenant={tenant}
        isAuthenticated={isAuthenticated}
        user={user}
        operationalHref={operationalHref}
        operationalLabel={operationalLabel}
        onLogout={async () => {
          await logout();
        }}
      />
    </>
  );
}

