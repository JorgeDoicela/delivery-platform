"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Search, User, Phone, Mail } from "lucide-react";
import { CartButtonBadge, CartDrawer } from "@/features/cart";
import {
  RESERVED_TENANT_SLUGS,
  TenantBranchSelector,
  TenantSwitcher,
  useCurrentTenantQuery,
} from "@/features/tenant";
import { ThemeToggle } from "@/shared/components/ThemeToggle";

function StorefrontHeader() {
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

  return (
    <header className="sticky top-0 z-40 bg-surface-card border-b border-surface-border shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[70px] sm:h-[76px] flex items-center justify-between gap-3 sm:gap-6">
        <div className="flex items-center gap-5 lg:gap-7 shrink-0">
          <Link href={brandHomeHref} className="flex items-center gap-2.5 group shrink-0">
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 shrink-0">
              <Image
                src={brandLogo}
                alt={`Logo ${brandName}`}
                width={40}
                height={40}
                priority
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span
                data-display-brand
                className="font-black text-2xl sm:text-[26px] tracking-tight text-brand-primary block leading-none uppercase font-display"
                suppressHydrationWarning
              >
                {brandName}
              </span>
              <span className="text-[10px] tracking-widest text-text-muted font-bold uppercase block mt-0.5" suppressHydrationWarning>
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

        <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
          {/* El conmutador multi-marca solo se expone en la landing de la plataforma (/); en la tienda del restaurante se ofrece el selector de sucursales del propio establecimiento */}
          {isPlatformRoot ? (
            <TenantSwitcher variant="auto" />
          ) : (
            <TenantBranchSelector tenant={tenant} />
          )}

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
            className="flex flex-col items-center justify-center text-text-strong hover:text-brand-primary transition-colors px-1 shrink-0"
            title="Mi Perfil / Iniciar Sesión"
          >
            <User className="w-5 h-5 text-text-strong stroke-[1.8]" />
            <span className="text-[10px] font-semibold text-text-muted leading-none mt-1">
              Perfil
            </span>
          </Link>

          <CartButtonBadge />
        </div>
      </div>
    </header>
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
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${
          isPlatformRoot ? "py-8 sm:py-10" : "py-5 sm:py-6"
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
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-2">
            {/* Marca & Contacto Directo */}
            <div className="space-y-2">
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
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
                {tenant?.contactPhone && (
                  <a
                    href={`tel:${tenant.contactPhone}`}
                    className="flex items-center gap-1.5 hover:text-brand-primary transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                    <span>
                      WhatsApp / Pedidos:{" "}
                      <strong className="text-text-strong font-mono">
                        {tenant.contactPhone}
                      </strong>
                    </span>
                  </a>
                )}
                {tenant?.contactEmail && (
                  <a
                    href={`mailto:${tenant.contactEmail}`}
                    className="flex items-center gap-1.5 hover:text-brand-primary transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                    <span>{tenant.contactEmail}</span>
                  </a>
                )}
              </div>
            </div>

            {/* Enlaces de Navegación Esenciales */}
            <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold text-text-muted">
              <Link
                href={`/${activeSlug}#catalogo`}
                className="hover:text-brand-primary transition-colors"
              >
                Menú & Combos
              </Link>
              <Link
                href={`/${activeSlug}#sucursales`}
                className="hover:text-brand-primary transition-colors"
              >
                Ubicación & Horarios
              </Link>
              <Link
                href="/rastreo"
                className="hover:text-brand-primary transition-colors"
              >
                Rastrear Pedido
              </Link>
            </nav>
          </div>
        )}

        {/* Sub-footer unificado */}
        <div className="mt-4 pt-3.5 border-t border-surface-border flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-text-subtle">
          <div>
            <span>
              © {currentYear} {brandName}.
              {tenant?.taxId ? ` RUC: ${tenant.taxId}.` : ""} Todos los derechos reservados.
            </span>
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
      <main className="flex-1 w-full">{children}</main>
      <React.Suspense fallback={null}>
        <StorefrontFooter />
      </React.Suspense>
      <React.Suspense fallback={null}>
        <CartDrawer />
      </React.Suspense>
    </div>
  );
}
