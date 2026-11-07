"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Utensils,
  MapPin,
  Clock,
  ShoppingBag,
  User,
} from "lucide-react";
import { useCartStore } from "@/features/cart";
import { RESERVED_TENANT_SLUGS, useCurrentTenantQuery } from "@/features/tenant";
import { useSmartScrollHeader } from "@/shared/hooks/useSmartScrollHeader";
import { useTenantRoutes } from "@/shared/lib/tenant-routing";

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
  const routes = useTenantRoutes(activeSlug || tenant?.slug);

  const homeHref = routes.getHomeHref();
  const catalogHref = routes.getCatalogHref();
  const sucursalesHref = routes.getSucursalesHref();
  const rastreoHref = routes.getRastreoHref();
  const loginHref = routes.getLoginHref();

  const openCart = useCartStore((s) => s.openCart);
  const items = useCartStore((s) => s.items);
  const cartCount = items.reduce((acc, i) => acc + i.quantity, 0);

  const isHomeActive =
    pathname === homeHref || (routes.basePath && pathname === routes.basePath);
  const isCatalogActive =
    pathname.includes("menu") || pathname.includes("catalogo");
  const isSucursalesActive = pathname.includes("sucursal");
  const isRastreoActive =
    pathname.includes("rastreo") || pathname.includes("track");
  const isLoginActive = pathname.includes("login");

  return (
    <nav
      aria-label="Navegación móvil inferior"
      className={`fixed bottom-0 left-0 right-0 z-30 bg-surface-card/95 backdrop-blur-md border-t border-surface-border px-1.5 py-1.5 flex items-center justify-around xl:hidden shadow-lg select-none transition-all duration-300 ease-in-out ${
        isVisible
          ? "translate-y-0 opacity-100 pointer-events-auto"
          : "translate-y-full opacity-0 pointer-events-none"
      }`}
      style={{ paddingBottom: "max(0.4rem, env(safe-area-inset-bottom))" }}
    >
      <Link
        href={homeHref}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-bold font-display uppercase tracking-wider transition-colors min-w-[50px] min-h-[44px] ${
          isHomeActive
            ? "text-brand-primary"
            : "text-text-muted hover:text-text-strong"
        }`}
      >
        <Home className="w-5 h-5 mb-0.5" />
        <span>Inicio</span>
      </Link>

      <Link
        href={catalogHref}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-bold font-display uppercase tracking-wider transition-colors min-w-[50px] min-h-[44px] ${
          isCatalogActive
            ? "text-brand-primary"
            : "text-text-muted hover:text-text-strong"
        }`}
      >
        <Utensils className="w-5 h-5 mb-0.5" />
        <span>{routes.isPlatformRoot ? "Marcas" : "Menú"}</span>
      </Link>

      <Link
        href={sucursalesHref}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-bold font-display uppercase tracking-wider transition-colors min-w-[50px] min-h-[44px] ${
          isSucursalesActive
            ? "text-brand-primary"
            : "text-text-muted hover:text-text-strong"
        }`}
      >
        <MapPin className="w-5 h-5 mb-0.5" />
        <span>Locales</span>
      </Link>

      <Link
        href={rastreoHref}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-bold font-display uppercase tracking-wider transition-colors min-w-[50px] min-h-[44px] ${
          isRastreoActive
            ? "text-brand-primary"
            : "text-text-muted hover:text-text-strong"
        }`}
      >
        <Clock className="w-5 h-5 mb-0.5" />
        <span>Rastreo</span>
      </Link>

      <button
        type="button"
        onClick={openCart}
        className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-bold font-display uppercase tracking-wider text-text-strong hover:text-brand-primary transition-colors min-w-[50px] min-h-[44px] relative cursor-pointer"
        aria-label="Ver carrito de compras"
      >
        <div className="relative">
          <ShoppingBag className="w-5 h-5 mb-0.5" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-2 min-w-[16px] h-[16px] px-1 bg-brand-primary text-white font-black text-[9px] rounded-full flex items-center justify-center shadow-xs">
              {cartCount}
            </span>
          )}
        </div>
        <span>Bolsa</span>
      </button>

      <Link
        href={loginHref}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-bold font-display uppercase tracking-wider transition-colors min-w-[50px] min-h-[44px] ${
          isLoginActive
            ? "text-brand-primary"
            : "text-text-muted hover:text-text-strong"
        }`}
      >
        <User className="w-5 h-5 mb-0.5" />
        <span>Perfil</span>
      </Link>
    </nav>
  );
}

