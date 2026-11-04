"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { MapPin, Search, User } from "lucide-react";
import { CartButtonBadge } from "@/features/cart";
import {
  RESERVED_TENANT_SLUGS,
  TenantBranchSelector,
  TenantSwitcher,
  useCurrentTenantQuery,
} from "@/features/tenant";

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
    <header className="sticky top-0 z-40 bg-white border-b border-neutral-200/80 shadow-xs">
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

          <nav className="hidden xl:flex items-center gap-5 text-[13px] sm:text-sm font-semibold text-neutral-800">
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
            <TenantSwitcher />
          ) : (
            <TenantBranchSelector tenant={tenant} />
          )}

          <div className="hidden lg:flex items-center">
            <Link
              href={catalogHref}
              className="flex items-center gap-2.5 px-4 py-2 w-48 xl:w-64 bg-[#f8f7f5] hover:bg-neutral-200/70 rounded-full transition-colors border border-neutral-200/60 text-neutral-500 group"
            >
              <Search className="w-4 h-4 text-neutral-500 group-hover:text-brand-primary transition-colors shrink-0" />
              <span className="text-xs sm:text-sm text-neutral-400 font-normal truncate">
                {isPlatformRoot ? "Buscar restaurantes..." : `Buscar en ${brandName}...`}
              </span>
            </Link>
          </div>

          <Link
            href="/login"
            className="flex flex-col items-center justify-center text-neutral-800 hover:text-brand-primary transition-colors px-1 shrink-0"
            title="Mi Perfil / Iniciar Sesión"
          >
            <User className="w-5 h-5 text-neutral-800 stroke-[1.8]" />
            <span className="text-[10px] font-semibold text-neutral-700 leading-none mt-1">
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
      className="bg-neutral-100 text-neutral-600 text-xs border-t border-neutral-200 mt-16 py-12"
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
            <span className="font-black text-xl tracking-tight text-neutral-900 block font-display" suppressHydrationWarning>
              {brandName}
            </span>
          </div>
          <p className="text-neutral-500 leading-relaxed" suppressHydrationWarning>
            {brandDescription}
          </p>
        </div>

        <div>
          <h4 className="font-bold text-neutral-900 uppercase tracking-wider text-[11px] mb-3" suppressHydrationWarning>
            {branches.length === 1 ? "Nuestro Local" : "Sucursales en Servicio"}
          </h4>
          <ul className="space-y-2">
            {branches.map((b) => (
              <li key={b.id} className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-neutral-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-neutral-900 block" suppressHydrationWarning>
                    {b.name}
                  </span>
                  <span className="text-neutral-500 block" suppressHydrationWarning>{b.address}</span>
                  <span className="text-[11px] text-neutral-400 block font-mono" suppressHydrationWarning>
                    {b.openingTime} a {b.closingTime}
                  </span>
                </div>
              </li>
            ))}
            {branches.length === 0 && (
              <li className="text-neutral-400 italic">
                Cargando red de locales asociados...
              </li>
            )}
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-neutral-900 uppercase tracking-wider text-[11px] mb-3">
            {isPlatformRoot ? "Plataforma & Transparencia" : "Métodos de Pago"}
          </h4>
          <p className="text-neutral-500 mb-2 leading-relaxed">
            {isPlatformRoot
              ? "Plataforma gastronómica SaaS multi-tenant sin comisiones abusivas por pedido."
              : "Aceptamos efectivo contra entrega y transferencia bancaria directa."}
          </p>
          <div className="flex items-center gap-3 font-semibold text-neutral-800">
            <Link
              href="/terminos"
              className="text-neutral-600 hover:text-brand-primary underline transition-colors"
            >
              Términos
            </Link>
            <span>•</span>
            <Link
              href="/privacidad"
              className="text-neutral-600 hover:text-brand-primary underline transition-colors"
            >
              Privacidad
            </Link>
          </div>
          <span className="text-[11px] text-neutral-400 block mt-2">
            © {new Date().getFullYear()} {brandName}. Todos los derechos reservados.
          </span>
        </div>

        <div>
          <h4 className="font-bold text-neutral-900 uppercase tracking-wider text-[11px] mb-3">
            {isPlatformRoot ? "Accesos Operativos Demo" : "Atención & Despacho"}
          </h4>
          {isPlatformRoot ? (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-neutral-700 bg-white p-2.5 rounded-xl border border-neutral-200">
                <span className="w-2 h-2 rounded-full bg-status-success animate-pulse shrink-0"></span>
                <span className="text-[11px] font-medium leading-tight">
                  Ecosistema Multi-Tenant Activo
                </span>
              </div>
              <Link
                href="/superadmin"
                className="inline-flex items-center justify-center w-full text-xs font-bold uppercase tracking-wider bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2.5 rounded-full transition-colors shadow-sm"
              >
                Consola SuperAdmin
              </Link>
              <Link
                href="/cocina"
                className="inline-flex items-center justify-center w-full text-xs font-bold uppercase tracking-wider bg-white hover:bg-neutral-50 text-neutral-900 border border-neutral-300 px-4 py-2 rounded-full transition-colors"
              >
                Terminal KDS Demo
              </Link>
            </div>
          ) : (
            <div className="space-y-2 text-neutral-600">
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                Despacho propio geolocalizado en tiempo real sin recargos ocultos de intermediarios.
              </p>
              {tenant?.contactPhone && tenant.contactPhone !== "0987654321" && (
                <div className="pt-1 text-[11px] font-mono text-neutral-600">
                  <p>Teléfono: <span className="font-bold text-neutral-900">{tenant.contactPhone}</span></p>
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
    <div className="flex flex-col min-h-screen bg-surface-canvas">
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
