"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Search,
  User,
  Menu,
  X,
  Home,
  Utensils,
  Clock,
} from "lucide-react";
import { CartButtonBadge } from "@/features/cart";
import {
  RESERVED_TENANT_SLUGS,
  TenantBranchSelector,
  TenantSwitcher,
  useCurrentTenantQuery,
} from "@/features/tenant";
import { ThemeToggle } from "@/shared/components/ThemeToggle";
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

            <Link
              href={routes.getLoginHref()}
              className="hidden sm:flex flex-col items-center justify-center text-text-strong hover:text-brand-primary transition-colors px-1 shrink-0"
              title="Mi Perfil / Iniciar Sesión"
            >
              <User className="w-5 h-5 text-text-strong stroke-[1.8]" />
              <span className="text-[10px] font-semibold text-text-muted leading-none mt-1">
                Perfil
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

      {/* Drawer Deslizante Móvil */}
      {isMobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menú de navegación móvil"
          className="fixed inset-0 z-50 xl:hidden animate-in fade-in duration-200"
        >
          <div
            className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          <div className="fixed inset-y-0 right-0 w-[85vw] max-w-sm bg-surface-card border-l border-surface-border shadow-2xl flex flex-col justify-between p-5 sm:p-6 z-10 animate-in slide-in-from-right duration-300 overflow-y-auto">
            <div className="space-y-6">
              {/* Cabecera del Drawer */}
              <div className="flex items-center justify-between pb-4 border-b border-surface-border">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative w-8 h-8 shrink-0">
                    <Image
                      src={brandLogo}
                      alt={`Logo ${brandName}`}
                      width={32}
                      height={32}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="font-display font-black text-xl uppercase tracking-tight text-brand-primary block leading-none truncate">
                      {brandName}
                    </span>
                    <span className="text-[9px] tracking-widest text-text-muted font-bold uppercase block mt-0.5 truncate">
                      {brandTagline}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-text-muted hover:text-text-strong hover:bg-surface-card-hover transition-colors cursor-pointer shrink-0"
                  aria-label="Cerrar menú"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Selector de Comercio o Sucursal en Móvil */}
              <div className="sm:hidden">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1.5">
                  {isPlatformRoot ? "Directorio de Marcas:" : "Sucursal Activa:"}
                </span>
                {isPlatformRoot ? (
                  <TenantSwitcher variant="auto" />
                ) : (
                  <TenantBranchSelector tenant={tenant} />
                )}
              </div>

              {/* Buscador Rápido en Móvil */}
              <div>
                <Link
                  href={catalogHref}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 w-full bg-surface-canvas hover:bg-surface-card-hover rounded-full transition-colors border border-surface-border text-text-muted group"
                >
                  <Search className="w-4 h-4 text-text-muted group-hover:text-brand-primary transition-colors shrink-0" />
                  <span className="text-xs text-text-muted font-normal truncate">
                    {isPlatformRoot ? "Buscar restaurantes..." : `Buscar en ${brandName}...`}
                  </span>
                </Link>
              </div>

              {/* Enlaces de Navegación Móvil */}
              <nav className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block px-3 py-1">
                  Navegación
                </span>

                <Link
                  href={brandHomeHref}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3.5 py-3 rounded-2xl hover:bg-surface-canvas text-text-strong hover:text-brand-primary font-display font-black text-sm uppercase tracking-wide transition-colors"
                >
                  <Home className="w-4 h-4 text-brand-primary shrink-0" />
                  <span>Inicio</span>
                </Link>

                <Link
                  href={catalogHref}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3.5 py-3 rounded-2xl hover:bg-surface-canvas text-text-strong hover:text-brand-primary font-display font-black text-sm uppercase tracking-wide transition-colors"
                >
                  <Utensils className="w-4 h-4 text-brand-primary shrink-0" />
                  <span>{isPlatformRoot ? "Directorio de Restaurantes" : "Menú & Combos"}</span>
                </Link>

                <Link
                  href={routes.getRastreoHref()}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3.5 py-3 rounded-2xl hover:bg-surface-canvas text-text-strong hover:text-brand-primary font-display font-black text-sm uppercase tracking-wide transition-colors"
                >
                  <Clock className="w-4 h-4 text-brand-primary shrink-0" />
                  <span>Rastrear mi Pedido</span>
                </Link>
              </nav>
            </div>

            {/* Pie del Drawer */}
            <div className="pt-6 border-t border-surface-border space-y-3">
              <Link
                href={routes.getLoginHref()}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between px-4 py-3 rounded-2xl bg-surface-canvas hover:bg-surface-card-hover border border-surface-border text-text-strong text-xs font-bold uppercase tracking-wider font-display transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <User className="w-4 h-4 text-brand-primary" />
                  <span>Mi Perfil / Iniciar Sesión</span>
                </div>
                <span className="text-[10px] text-text-muted">&rarr;</span>
              </Link>

              <div className="flex items-center justify-between px-2 pt-1">
                <span className="text-[11px] text-text-muted font-medium">Tema Visual:</span>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

