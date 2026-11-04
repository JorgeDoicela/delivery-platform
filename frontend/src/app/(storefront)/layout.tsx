"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Search, User } from "lucide-react";
import { CartButtonBadge } from "@/features/cart";
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
  const tenantSlug = tenant?.slug || "la-granjita";
  const brandHomeHref = isPlatformRoot ? "/" : `/${tenantSlug}`;
  const catalogHref = isPlatformRoot ? "/#restaurantes" : `/${tenantSlug}#catalogo`;
  const brandName = isPlatformRoot
    ? "DELIVERY PLATFORM"
    : tenant?.name || "Restaurante Asociado";
  const brandTagline = isPlatformRoot
    ? "ECOSISTEMA DE RESTAURANTES & DELIVERY"
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
    ? "DELIVERY PLATFORM"
    : tenant?.name || "Restaurante Asociado";
  const brandLogo = isPlatformRoot
    ? "/images/platform/logo.png"
    : tenant?.logoUrl || "/images/shared/placeholders/logo-default.png";
  const brandDescription =
    tenant?.description ||
    "Pedidos directos sin intermediarios con despacho geolocalizado en tiempo real.";
  const branches = tenant?.branches ?? [];

  return (
    <footer
      id="footer-info"
      className="bg-surface-card text-text-muted text-xs border-t border-surface-border mt-16 py-12 transition-colors duration-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2.5 mb-3">
            <div className="relative w-8 h-8 shrink-0">
              <Image
                src={brandLogo}
                alt={`Logo ${brandName}`}
                width={32}
                height={32}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-black text-xl tracking-tight text-text-strong block font-display" suppressHydrationWarning>
              {brandName}
            </span>
          </div>
          <p className="text-text-muted leading-relaxed" suppressHydrationWarning>
            {brandDescription}
          </p>
        </div>

        <div>
          <h4 className="font-bold text-text-strong uppercase tracking-wider text-[11px] mb-3">
            {isPlatformRoot ? "Cobertura Geográfica" : "Sucursales & Cobertura"}
          </h4>
          {branches.length > 0 ? (
            <ul className="space-y-2">
              {branches.map((b) => (
                <li key={b.id} className="flex flex-col">
                  <span className="font-semibold text-text-strong">{b.name}</span>
                  <span className="text-[11px] text-text-muted">{b.address}</span>
                  <span className="text-[10px] text-status-success font-mono">
                    {b.openingTime} a {b.closingTime}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-text-muted">
              {isPlatformRoot
                ? "Múltiples sucursales geolocalizadas con cálculo de polígonos PostGIS por cada franquicia."
                : "Información de sucursales disponible al seleccionar tu ubicación de entrega."}
            </p>
          )}
        </div>

        <div>
          <h4 className="font-bold text-text-strong uppercase tracking-wider text-[11px] mb-3">
            Enlaces & Legal
          </h4>
          <div className="flex flex-col gap-2">
            <Link
              href={isPlatformRoot ? "/#restaurantes" : `/${tenant?.slug || "la-granjita"}`}
              className="hover:text-brand-primary transition-colors"
            >
              Catálogo de Productos
            </Link>
            <Link
              href="/rastreo"
              className="hover:text-brand-primary transition-colors"
            >
              Rastrear mi Pedido
            </Link>
            <Link
              href="#terminos"
              className="hover:text-brand-primary transition-colors"
            >
              Términos del Servicio
            </Link>
            <Link
              href="#privacidad"
              className="hover:text-brand-primary transition-colors"
            >
              Privacidad
            </Link>
          </div>
          <span className="text-[11px] text-text-subtle block mt-2">
            © {new Date().getFullYear()} {brandName}. Todos los derechos reservados.
          </span>
        </div>

        <div>
          <h4 className="font-bold text-text-strong uppercase tracking-wider text-[11px] mb-3">
            {isPlatformRoot ? "Accesos Operativos Demo" : "Atención & Despacho"}
          </h4>
          {isPlatformRoot ? (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-text-strong bg-surface-canvas p-2.5 rounded-xl border border-surface-border">
                <span className="w-2 h-2 rounded-full bg-status-success animate-pulse shrink-0"></span>
                <span className="text-[11px] font-medium leading-tight">
                  Ecosistema Multi-Tenant Activo
                </span>
              </div>
              <Link
                href="/superadmin"
                className="inline-flex items-center justify-center w-full text-xs font-bold uppercase tracking-wider bg-brand-primary hover:bg-brand-primary-hover text-white px-4 py-2.5 rounded-full transition-colors shadow-sm"
              >
                Consola SuperAdmin
              </Link>
              <Link
                href="/cocina"
                className="inline-flex items-center justify-center w-full text-xs font-bold uppercase tracking-wider bg-surface-card hover:bg-surface-canvas text-text-strong border border-surface-border px-4 py-2 rounded-full transition-colors"
              >
                Terminal KDS Demo
              </Link>
            </div>
          ) : (
            <div className="space-y-2 text-text-muted">
              <p className="text-[11px] text-text-muted leading-relaxed">
                Despacho propio geolocalizado en tiempo real sin recargos ocultos de intermediarios.
              </p>
              {tenant?.contactPhone && tenant.contactPhone !== "0987654321" && (
                <div className="pt-1 text-[11px] font-mono text-text-muted">
                  <p>Teléfono: <span className="font-bold text-text-strong">{tenant.contactPhone}</span></p>
                </div>
              )}
            </div>
          )}
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
    </div>
  );
}
