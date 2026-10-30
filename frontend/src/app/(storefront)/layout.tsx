"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Search, User } from "lucide-react";
import { CartButtonBadge } from "@/features/cart";
import { TenantSwitcher, useCurrentTenantQuery } from "@/features/tenant";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: tenant } = useCurrentTenantQuery();

  const brandName = tenant?.name || "La Granjita Asadero";
  const brandTagline = tenant?.tagline || "Asadero & Leña";
  const brandLogo = tenant?.logoUrl || "/images/identidad/logo.png";
  const brandDescription =
    tenant?.description ||
    "Pedidos directos sin intermediarios con despacho geolocalizado en tiempo real.";
  const branches = tenant?.branches ?? [];

  return (
    <div className="flex flex-col min-h-screen bg-surface-canvas">
      {/* Header Comercial Dinámico Multi-Tenant */}
      <header className="sticky top-0 z-40 bg-white border-b border-neutral-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[70px] sm:h-[76px] flex items-center justify-between gap-3 sm:gap-6">
          <div className="flex items-center gap-5 lg:gap-7 shrink-0">
            <Link href="/" className="flex items-center gap-2.5 group shrink-0">
              <div className="relative w-9 h-9 sm:w-10 sm:h-10 shrink-0">
                <Image
                  src={brandLogo}
                  alt={`Logo ${brandName}`}
                  width={40}
                  height={40}
                  priority
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                />
              </div>
              <div>
                <span
                  data-display-brand
                  className="font-black text-2xl sm:text-[26px] tracking-tight text-brand-primary block leading-none uppercase font-display"
                >
                  {brandName}
                </span>
                <span className="text-[10px] tracking-widest text-text-muted font-bold uppercase block mt-0.5">
                  {brandTagline}
                </span>
              </div>
            </Link>

            <nav className="hidden xl:flex items-center gap-5 text-[13px] sm:text-sm font-semibold text-neutral-800">
              <Link
                href="/#catalogo"
                className="hover:text-brand-primary transition-colors"
              >
                Ordenar
              </Link>
              <Link
                href="/sucursales"
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
              <Link
                href="/admin/personalizacion"
                className="hover:text-brand-primary transition-colors"
              >
                Personalizar
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
            {/* Conmutador de Negocio / Directorio Multi-Tenant */}
            <TenantSwitcher />

            <div className="hidden lg:flex items-center">
              <a
                href="#catalogo"
                className="flex items-center gap-2.5 px-4 py-2 w-48 xl:w-64 bg-[#f8f7f5] hover:bg-neutral-200/70 rounded-full transition-colors border border-neutral-200/60 text-neutral-500 group"
              >
                <Search className="w-4 h-4 text-neutral-500 group-hover:text-brand-primary transition-colors shrink-0" />
                <span className="text-xs sm:text-sm text-neutral-400 font-normal">
                  Buscar en menú
                </span>
              </a>
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

      <main className="flex-1 w-full">{children}</main>

      {/* Footer Dinámico por Tenant */}
      <footer
        id="sucursales"
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
              <span className="font-black text-brand-primary text-base uppercase tracking-tight font-display">
                {brandName}
              </span>
            </div>
            <p className="text-neutral-500 leading-relaxed">
              {brandDescription}
            </p>
          </div>

          <div>
            <h4 className="font-bold text-neutral-900 uppercase tracking-wider text-[11px] mb-3">
              Sucursales Operativas ({branches.length})
            </h4>
            <ul className="space-y-2">
              {branches.map((branch) => (
                <li key={branch.id} className="flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-brand-primary mt-0.5 shrink-0" />
                  <span>
                    {branch.name}: {branch.address}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-neutral-900 uppercase tracking-wider text-[11px] mb-3">
              Garantía y Facturación
            </h4>
            <p className="text-neutral-500 leading-relaxed mb-2">
              Facturación electrónica autorizada SRI ({tenant?.businessName} • RUC{" "}
              {tenant?.taxId}). Despacho monitoreado en tiempo real.
            </p>
            <span className="text-[11px] text-neutral-400">
              © 2026 {brandName}. Todos los derechos reservados.
            </span>
          </div>

          <div>
            <h4 className="font-bold text-neutral-900 uppercase tracking-wider text-[11px] mb-3">
              Accesos Operativos
            </h4>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-neutral-700 bg-white p-2.5 rounded-xl border border-neutral-200">
                <span className="w-2 h-2 rounded-full bg-status-success animate-pulse shrink-0"></span>
                <span className="text-[11px] font-medium leading-tight">
                  Cocina activa: Tomando pedidos
                </span>
              </div>
              <Link
                href="/cocina"
                className="inline-flex items-center justify-center w-full text-xs font-bold uppercase tracking-wider bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2.5 rounded-full transition-colors shadow-sm"
              >
                Terminal KDS • {brandName}
              </Link>
              <Link
                href="/admin/personalizacion"
                className="inline-flex items-center justify-center w-full text-xs font-bold uppercase tracking-wider bg-white hover:bg-neutral-50 text-neutral-900 border border-neutral-300 px-4 py-2 rounded-full transition-colors"
              >
                Personalizar Landing & Marca
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
