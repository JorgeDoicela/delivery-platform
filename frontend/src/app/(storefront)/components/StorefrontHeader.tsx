"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { CartButtonBadge } from "@/features/cart";
import {
  RESERVED_TENANT_SLUGS,
  TenantBranchSelector,
  TenantSwitcher,
  useCurrentTenantQuery,
} from "@/features/tenant";
import { useAuthStore, UserRole, isUserInRole, UserNav } from "@/features/auth";
import { ThemeToggle, AppHeader } from "@/shared/components";
import { useIsMounted } from "@/shared/hooks/useIsMounted";
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
  const storefrontHomeHref = routes.getHomeHref();
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

  const isMounted = useIsMounted();
  const rawUser = useAuthStore((s) => s.user);
  const rawIsAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);

  const isAuthenticated = isMounted && rawIsAuthenticated;
  const user = isMounted ? rawUser : null;

  const isSuperAdmin = isUserInRole(user, UserRole.SuperAdmin);
  const isTenantAdmin = isUserInRole(user, UserRole.TenantAdmin);
  const isBranchManager = isUserInRole(user, UserRole.BranchManager);
  const isKitchenStaff = isUserInRole(user, UserRole.KitchenStaff);
  const isCashier = isUserInRole(user, UserRole.Cashier);
  const isDriver = isUserInRole(user, UserRole.Driver);

  const canManageFranchise = isSuperAdmin || isTenantAdmin || isBranchManager;
  const isStaffOrAdmin =
    canManageFranchise || isKitchenStaff || isCashier || isDriver;
  const isCustomerOrGuest = !isStaffOrAdmin;

  const userBranch = user?.branchId
    ? tenant?.branches?.find((b) => b.id === Number(user.branchId))
    : undefined;
  const useKitchenWorkflow =
    userBranch?.useKitchenWorkflow ?? tenant?.enableKitchenWorkflow ?? true;

  const operationsHref = useKitchenWorkflow
    ? routes.getKitchenHref()
    : routes.getMostradorHref();
  const operationsLabel = useKitchenWorkflow ? "Cocina KDS" : "Mostrador";

  const operationalHref = isSuperAdmin
    ? routes.getSuperAdminHref()
    : isTenantAdmin
      ? routes.getAdminHref("personalizacion")
      : isBranchManager
        ? routes.getAdminHref("inventario")
        : isKitchenStaff || isCashier
          ? operationsHref
          : isDriver
            ? routes.getDriverHref()
            : null;

  const operationalLabel = isSuperAdmin
    ? "Marcas"
    : isTenantAdmin
      ? "Marca"
      : isBranchManager
        ? "Inventario"
        : isKitchenStaff || isCashier
          ? operationsLabel
          : isDriver
            ? "Reparto"
            : null;

  const brandPrimaryHref =
    isCashier || isKitchenStaff || canManageFranchise
      ? operationsHref
      : isDriver
        ? routes.getDriverHref()
        : storefrontHomeHref;

  const [currentHash, setCurrentHash] = useState("");

  useEffect(() => {
    const handleHash = () => {
      if (typeof window !== "undefined") {
        setCurrentHash(window.location.hash);
      }
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => {
      window.removeEventListener("hashchange", handleHash);
    };
  }, []);

  const isCatalogActive =
    pathname.includes("menu") ||
    pathname.includes("catalogo") ||
    (isPlatformRoot && currentHash === "#restaurantes") ||
    (!isPlatformRoot && currentHash === "#catalogo");

  const isHomeActive =
    (pathname === storefrontHomeHref ||
      (routes.basePath ? pathname === routes.basePath : pathname === "/") ||
      pathname.includes("/sucursal/")) &&
    !pathname.includes("menu") &&
    !pathname.includes("catalogo") &&
    !pathname.includes("pedidos") &&
    !pathname.includes("rastreo") &&
    !pathname.includes("track") &&
    !pathname.includes("login") &&
    !pathname.includes("cuenta") &&
    !pathname.includes("checkout") &&
    !pathname.includes("finalizar-pedido") &&
    !isCatalogActive;
  const isPedidosActive =
    pathname.includes("pedidos") ||
    pathname.includes("rastreo") ||
    pathname.includes("track");

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
  const isDriverActive = pathname.includes("/repartidor");

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setIsMobileMenuOpen(false);
  }

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
      <AppHeader
        onFocus={() => setIsVisible(true)}
        isVisible={isVisible}
        isScrolled={isScrolled}
        pinOnDesktop={isStaffOrAdmin}
        leadingAction={
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-1.5 -ml-1 sm:-ml-2 rounded-full text-text-strong hover:bg-surface-card-hover cursor-pointer shrink-0 transition-colors xl:hidden"
            aria-label="Abrir menú de navegación"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        }
        brand={{
          name: brandName,
          logo: brandLogo,
          href: brandPrimaryHref,
          tagline: brandTagline,
          variant: "primary",
        }}
        navigation={
          <div className="flex items-center gap-5 lg:gap-6 text-xs sm:text-sm font-display font-bold uppercase tracking-wider">
            {isCustomerOrGuest && (
              <>
                <Link
                  href={storefrontHomeHref}
                  className={`transition-colors hover:text-brand-primary ${
                    isHomeActive ? "text-brand-primary" : "text-text-strong"
                  }`}
                >
                  Inicio
                </Link>
                <Link
                  href={catalogHref}
                  className={`transition-colors hover:text-brand-primary ${
                    isCatalogActive ? "text-brand-primary" : "text-text-strong"
                  }`}
                >
                  {isPlatformRoot ? "Restaurantes" : "Menú & Combos"}
                </Link>
                {isAuthenticated && (
                  <Link
                    href={routes.getPedidosHref()}
                    className={`transition-colors hover:text-brand-primary ${
                      isPedidosActive ? "text-brand-primary" : "text-text-strong"
                    }`}
                  >
                    Mis Pedidos
                  </Link>
                )}
              </>
            )}

            {(isCashier || isKitchenStaff) && (
              <Link
                href={operationsHref}
                className={`transition-colors hover:text-brand-primary ${
                  isOperationsActive ? "text-brand-primary" : "text-text-strong"
                }`}
              >
                {operationsLabel}
              </Link>
            )}

            {isDriver && (
              <Link
                href={routes.getDriverHref()}
                className={`transition-colors hover:text-brand-primary ${
                  isDriverActive ? "text-brand-primary" : "text-text-strong"
                }`}
              >
                Reparto
              </Link>
            )}

            {canManageFranchise && (
              <>
                {isSuperAdmin && (
                  <Link
                    href={routes.getSuperAdminHref()}
                    className={`transition-colors hover:text-brand-primary ${
                      isSuperAdminActive
                        ? "text-brand-primary"
                        : "text-text-strong"
                    }`}
                  >
                    Marcas
                  </Link>
                )}
                <Link
                  href={operationsHref}
                  className={`transition-colors hover:text-brand-primary ${
                    isOperationsActive
                      ? "text-brand-primary"
                      : "text-text-strong"
                  }`}
                >
                  {operationsLabel}
                </Link>
                <Link
                  href={routes.getAdminHref("inventario")}
                  className={`transition-colors hover:text-brand-primary ${
                    isInventoryActive
                      ? "text-brand-primary"
                      : "text-text-strong"
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
                {(isTenantAdmin || isSuperAdmin) && (
                  <Link
                    href={routes.getAdminHref("personalizacion")}
                    className={`transition-colors hover:text-brand-primary ${
                      isBrandingActive
                        ? "text-brand-primary"
                        : "text-text-strong"
                    }`}
                  >
                    Marca
                  </Link>
                )}
                <Link
                  href={storefrontHomeHref}
                  className={`transition-colors hover:text-brand-primary ${
                    isHomeActive ? "text-brand-primary" : "text-text-strong"
                  }`}
                >
                  Tienda
                </Link>
              </>
            )}
          </div>
        }
        actions={
          <>
            {isSuperAdmin ? (
              <div className="hidden sm:block">
                <TenantSwitcher variant="auto" />
              </div>
            ) : isCustomerOrGuest ? (
              <div className="hidden sm:block">
                {isPlatformRoot ? (
                  <TenantSwitcher variant="auto" />
                ) : (
                  <TenantBranchSelector tenant={tenant} />
                )}
              </div>
            ) : null}

            <ThemeToggle />

            <UserNav
              tenantSlug={activeSlug || tenant?.slug}
              showGuestLogin
            />

            {isCustomerOrGuest && <CartButtonBadge />}
          </>
        }
      />

      <StorefrontMobileDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        brandName={brandName}
        brandTagline={brandTagline}
        brandLogo={brandLogo}
        isPlatformRoot={isPlatformRoot}
        routes={routes}
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

