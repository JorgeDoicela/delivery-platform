"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Search,
  User,
  Phone,
  Mail,
  Menu,
  X,
  Home,
  Utensils,
  MapPin,
  Clock,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { CartButtonBadge, CartDrawer, useCartStore } from "@/features/cart";
import {
  RESERVED_TENANT_SLUGS,
  TenantBranchSelector,
  TenantSwitcher,
  useCurrentTenantQuery,
} from "@/features/tenant";
import { ThemeToggle } from "@/shared/components/ThemeToggle";
import { useSmartScrollHeader } from "@/shared/hooks/useSmartScrollHeader";

function StorefrontHeader() {
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

  const isPlatformRoot = pathname === "/";
  const tenantSlug = tenant?.slug || activeSlug || "";
  const brandHomeHref = isPlatformRoot ? "/" : (tenantSlug ? `/${tenantSlug}` : "/");
  const catalogHref = isPlatformRoot ? "/#restaurantes" : (tenantSlug ? `/${tenantSlug}/menu` : "/#restaurantes");
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

            <nav className="hidden xl:flex items-center gap-5 text-[13px] sm:text-sm font-semibold text-text-strong">
              <Link
                href={catalogHref}
                className="hover:text-brand-primary transition-colors"
              >
                {isPlatformRoot ? "Restaurantes" : "Menú & Combos"}
              </Link>
              {!isPlatformRoot && (
                <Link
                  href={`/${tenantSlug}#especialidades`}
                  className="hover:text-brand-primary transition-colors"
                >
                  Especialidades
                </Link>
              )}
              <Link
                href={isPlatformRoot ? "/#sucursales" : `/${tenantSlug}#sucursales`}
                className="hover:text-brand-primary transition-colors"
              >
                Sucursales
              </Link>
              <Link
                href="/rastreo"
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
              href="/login"
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

                {!isPlatformRoot && (
                  <Link
                    href={`/${tenantSlug}#especialidades`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-3 rounded-2xl hover:bg-surface-canvas text-text-strong hover:text-brand-primary font-display font-black text-sm uppercase tracking-wide transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-brand-accent shrink-0" />
                    <span>Especialidades</span>
                  </Link>
                )}

                <Link
                  href="/sucursales"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3.5 py-3 rounded-2xl hover:bg-surface-canvas text-text-strong hover:text-brand-primary font-display font-black text-sm uppercase tracking-wide transition-colors"
                >
                  <MapPin className="w-4 h-4 text-brand-primary shrink-0" />
                  <span>Sucursales & Horarios</span>
                </Link>

                <Link
                  href="/rastreo"
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
                href="/login"
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

function StorefrontFooter() {
  const pathname = usePathname();
  const rawSlug = pathname?.split("/").filter(Boolean)[0];
  const activeSlug =
    rawSlug && !RESERVED_TENANT_SLUGS.has(rawSlug.toLowerCase())
      ? rawSlug
      : undefined;
  const { data: tenant } = useCurrentTenantQuery(activeSlug);

  const isPlatformRoot = pathname === "/";
  const brandName = isPlatformRoot
    ? "MESAFY"
    : tenant?.name || "Restaurante Asociado";
  const brandLogo = isPlatformRoot
    ? "/images/platform/logo.png"
    : tenant?.logoUrl || "/images/shared/placeholders/logo-default.png";
  const brandDescription = isPlatformRoot
    ? "Plataforma integral de gestión de restaurantes, pedidos directos sin intermediarios y terminales operativas para salón, cocina y delivery."
    : tenant?.description ||
      "Pollo asado artesanalmente al carbón vegetal y leña seleccionada con recetas tradicionales y guarniciones frescas.";
  const currentYear = new Date().getFullYear();

  return (
    <footer
      id="footer-info"
      className="bg-surface-card text-text-muted text-xs border-t border-surface-border mt-8 sm:mt-10 transition-colors duration-200"
    >
      <div
        className={`w-full px-4 sm:px-8 md:px-12 lg:px-16 ${
          isPlatformRoot ? "max-w-7xl mx-auto py-8 sm:py-10" : "py-5 sm:py-6"
        }`}
      >
        {isPlatformRoot ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {/* Columna 1: Plataforma */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="relative w-8 h-8 shrink-0">
                  <Image
                    src={brandLogo}
                    alt={`Logo ${brandName}`}
                    width={32}
                    height={32}
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="font-black text-xl tracking-tight text-text-strong block font-display">
                  {brandName}
                </span>
              </div>
              <p className="text-text-muted leading-relaxed text-xs">
                {brandDescription}
              </p>
            </div>

            {/* Columna 2: Clientes & Pedidos */}
            <div className="space-y-3">
              <h4 className="font-bold text-text-strong uppercase tracking-wider text-[11px]">
                Explorar & Pedidos
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link
                    href="/#restaurantes"
                    className="hover:text-brand-primary transition-colors"
                  >
                    Directorio de Restaurantes
                  </Link>
                </li>
                <li>
                  <Link
                    href="/rastreo"
                    className="hover:text-brand-primary transition-colors"
                  >
                    Rastrear mi Pedido
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terminos"
                    className="hover:text-brand-primary transition-colors"
                  >
                    Términos del Servicio
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacidad"
                    className="hover:text-brand-primary transition-colors"
                  >
                    Política de Privacidad
                  </Link>
                </li>
              </ul>
            </div>

            {/* Columna 3: Para Restaurantes */}
            <div className="space-y-3">
              <h4 className="font-bold text-text-strong uppercase tracking-wider text-[11px]">
                Para Restaurantes
              </h4>
              <p className="text-text-muted leading-relaxed text-xs">
                Gestión integral de pedidos en línea, comandas de cocina KDS, terminales de salón y delivery geolocalizado en tiempo real.
              </p>
              <div className="pt-1">
                <a
                  href="#afiliacion"
                  className="inline-flex items-center text-xs font-bold text-brand-primary hover:underline font-display uppercase tracking-wider"
                >
                  Afiliar mi restaurante
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row items-center justify-between gap-5 pb-1">
            {/* 1. Marca a la izquierda */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="relative w-8 h-8 shrink-0">
                <Image
                  src={brandLogo}
                  alt={`Logo ${brandName}`}
                  width={32}
                  height={32}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-black text-xl tracking-tight text-text-strong uppercase font-display leading-none">
                {brandName}
              </span>
            </div>

            {/* 2. Mensaje Informativo Central (Opción 2) */}
            <div className="flex items-center justify-center gap-2 text-xs text-text-muted text-center py-0.5">
              <span className="font-semibold text-text-strong font-display uppercase tracking-wider">
                {tenant?.tagline || "Sabor Tradicional a la Brasa"}
              </span>
              <span className="text-text-subtle hidden sm:inline">&bull;</span>
              <span className="text-text-muted hidden sm:inline">
                Atención diaria 10:30 – 21:30
              </span>
            </div>

            {/* 3. Contacto directo a la derecha */}
            <div className="flex flex-wrap items-center justify-center lg:justify-end gap-x-5 gap-y-1 text-xs text-text-muted shrink-0">
              {tenant?.contactPhone && (
                <a
                  href={`tel:${tenant.contactPhone}`}
                  className="flex items-center gap-1.5 hover:text-brand-primary transition-colors"
                  title="WhatsApp / Pedidos"
                >
                  <Phone className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                  <span className="font-mono font-bold text-text-strong">
                    {tenant.contactPhone}
                  </span>
                </a>
              )}
              {tenant?.contactEmail && (
                <a
                  href={`mailto:${tenant.contactEmail}`}
                  className="flex items-center gap-1.5 hover:text-brand-primary transition-colors"
                  title="Correo de contacto"
                >
                  <Mail className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                  <span>{tenant.contactEmail}</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Sub-footer unificado */}
        <div className="mt-4 pt-3.5 border-t border-surface-border flex flex-col sm:flex-row items-center justify-between gap-2.5 text-[11px] text-text-subtle">
          <div className="text-center sm:text-left">
            <span>
              © {currentYear} {brandName}.
              {tenant?.taxId ? ` RUC: ${tenant.taxId}.` : ""}
            </span>{" "}
            <span className="inline-block">Todos los derechos reservados.</span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/terminos" className="hover:text-brand-primary transition-colors">
              Términos
            </Link>
            <Link href="/privacidad" className="hover:text-brand-primary transition-colors">
              Privacidad
            </Link>
            {!isPlatformRoot && (
              <span className="text-text-subtle">
                Tecnología por{" "}
                <Link
                  href="/"
                  className="font-semibold text-text-muted hover:text-brand-primary transition-colors font-display"
                >
                  Mesafy
                </Link>
              </span>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}

function MobileBottomNav() {
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
  const isPlatformRoot = pathname === "/";
  const homeHref = isPlatformRoot ? "/" : (activeSlug ? `/${activeSlug}` : "/");
  const catalogHref = isPlatformRoot ? "/#restaurantes" : (activeSlug ? `/${activeSlug}#catalogo` : "/#restaurantes");
  const openCart = useCartStore((s) => s.openCart);
  const items = useCartStore((s) => s.items);
  const cartCount = items.reduce((acc, i) => acc + i.quantity, 0);

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
          pathname === homeHref ? "text-brand-primary" : "text-text-muted hover:text-text-strong"
        }`}
      >
        <Home className="w-5 h-5 mb-0.5" />
        <span>Inicio</span>
      </Link>

      <Link
        href={catalogHref}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-bold font-display uppercase tracking-wider transition-colors min-w-[50px] min-h-[44px] ${
          pathname.includes("menu") || pathname.includes("catalogo")
            ? "text-brand-primary"
            : "text-text-muted hover:text-text-strong"
        }`}
      >
        <Utensils className="w-5 h-5 mb-0.5" />
        <span>{isPlatformRoot ? "Marcas" : "Menú"}</span>
      </Link>

      <Link
        href="/sucursales"
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-bold font-display uppercase tracking-wider transition-colors min-w-[50px] min-h-[44px] ${
          pathname === "/sucursales" ? "text-brand-primary" : "text-text-muted hover:text-text-strong"
        }`}
      >
        <MapPin className="w-5 h-5 mb-0.5" />
        <span>Locales</span>
      </Link>

      <Link
        href="/rastreo"
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-bold font-display uppercase tracking-wider transition-colors min-w-[50px] min-h-[44px] ${
          pathname.startsWith("/rastreo") || pathname.startsWith("/track")
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
        href="/login"
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-bold font-display uppercase tracking-wider transition-colors min-w-[50px] min-h-[44px] ${
          pathname === "/login" ? "text-brand-primary" : "text-text-muted hover:text-text-strong"
        }`}
      >
        <User className="w-5 h-5 mb-0.5" />
        <span>Perfil</span>
      </Link>
    </nav>
  );
}

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-surface-canvas text-text-strong transition-colors duration-200">
      <React.Suspense fallback={null}>
        <StorefrontHeader />
      </React.Suspense>
      <main className="flex-1 w-full pb-20 xl:pb-0">{children}</main>
      <React.Suspense fallback={null}>
        <StorefrontFooter />
      </React.Suspense>
      <React.Suspense fallback={null}>
        <MobileBottomNav />
      </React.Suspense>
      <React.Suspense fallback={null}>
        <CartDrawer />
      </React.Suspense>
    </div>
  );
}
