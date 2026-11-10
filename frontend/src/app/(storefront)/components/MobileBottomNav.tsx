"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Utensils,
  MapPin,
  Clock,
  User,
} from "lucide-react";
import {
  RESERVED_TENANT_SLUGS,
  useCurrentTenantQuery,
  useBranchesQuery,
} from "@/features/tenant";
import { useSmartScrollHeader } from "@/shared/hooks/useSmartScrollHeader";
import { useTenantRoutes } from "@/shared/lib/tenant-routing";
import { useAuthStore } from "@/features/auth/store/useAuthStore";

export function MobileBottomNav() {
  const { isVisible } = useSmartScrollHeader({
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
  const { data: branches } = useBranchesQuery(activeSlug || tenant?.slug);
  const routes = useTenantRoutes(activeSlug || tenant?.slug);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const homeHref = routes.getHomeHref();
  const catalogHref = routes.getCatalogHref();
  const sucursalesHref = routes.getSucursalesHref();
  const rastreoHref = routes.getRastreoHref();
  const profileHref = isAuthenticated ? routes.getAccountHref() : routes.getLoginHref();

  const isCheckout =
    pathname.includes("checkout") || pathname.includes("finalizar-pedido");

  if (isCheckout) {
    return null;
  }

  const branchCount = branches?.length ?? tenant?.branches?.length ?? 0;
  // Solo se expone el acceso a 'Locales' si la marca opera múltiples sucursales físicas (> 1).
  // Si la marca opera una única sucursal, el botón es redundante y se oculta para optimizar la ergonomía táctil.
  const hasMultipleBranches = branchCount > 1;

  const isHomeActive =
    pathname === homeHref || (routes.basePath && pathname === routes.basePath);
  const isCatalogActive =
    pathname.includes("menu") || pathname.includes("catalogo");
  const isSucursalesActive = pathname.includes("sucursal");
  const isRastreoActive =
    pathname.includes("rastreo") || pathname.includes("track");
  const isProfileActive =
    pathname.includes("login") || pathname.includes("cuenta");

  return (
    <nav
      aria-label="Navegación móvil inferior"
      className={`fixed bottom-0 left-0 right-0 z-30 bg-surface-card/95 backdrop-blur-md border-t border-surface-border h-[52px] px-1.5 flex items-center justify-around xl:hidden shadow-lg select-none transition-all duration-300 ease-in-out ${
        isVisible
          ? "translate-y-0 opacity-100 pointer-events-auto"
          : "translate-y-full opacity-0 pointer-events-none"
      }`}
    >
      <Link
        href={homeHref}
        className={`h-full flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[9px] font-bold font-display uppercase tracking-wider transition-colors min-w-[48px] ${
          isHomeActive
            ? "text-brand-primary"
            : "text-text-muted hover:text-text-strong"
        }`}
      >
        <Home className="w-[18px] h-[18px] mb-0.5" />
        <span>Inicio</span>
      </Link>

      <Link
        href={catalogHref}
        className={`h-full flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[9px] font-bold font-display uppercase tracking-wider transition-colors min-w-[48px] ${
          isCatalogActive
            ? "text-brand-primary"
            : "text-text-muted hover:text-text-strong"
        }`}
      >
        <Utensils className="w-[18px] h-[18px] mb-0.5" />
        <span>{routes.isPlatformRoot ? "Marcas" : "Menú"}</span>
      </Link>

      {hasMultipleBranches && (
        <Link
          href={sucursalesHref}
          className={`h-full flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[9px] font-bold font-display uppercase tracking-wider transition-colors min-w-[48px] ${
            isSucursalesActive
              ? "text-brand-primary"
              : "text-text-muted hover:text-text-strong"
          }`}
        >
          <MapPin className="w-[18px] h-[18px] mb-0.5" />
          <span>Locales</span>
        </Link>
      )}

      <Link
        href={rastreoHref}
        className={`h-full flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[9px] font-bold font-display uppercase tracking-wider transition-colors min-w-[48px] ${
          isRastreoActive
            ? "text-brand-primary"
            : "text-text-muted hover:text-text-strong"
        }`}
      >
        <Clock className="w-[18px] h-[18px] mb-0.5" />
        <span>Rastreo</span>
      </Link>

      <Link
        href={profileHref}
        className={`h-full flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[9px] font-bold font-display uppercase tracking-wider transition-colors min-w-[48px] ${
          isProfileActive
            ? "text-brand-primary"
            : "text-text-muted hover:text-text-strong"
        }`}
      >
        <User className="w-[18px] h-[18px] mb-0.5" />
        <span>{isAuthenticated ? "Cuenta" : "Perfil"}</span>
      </Link>
    </nav>
  );
}

