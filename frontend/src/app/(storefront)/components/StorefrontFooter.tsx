"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Phone, Mail } from "lucide-react";
import {
  RESERVED_TENANT_SLUGS,
  useCurrentTenantQuery,
} from "@/features/tenant";
import { useTenantRoutes } from "@/shared/lib/tenant-routing";

export function StorefrontFooter() {
  const pathname = usePathname();
  const rawSlug = pathname?.split("/").filter(Boolean)[0];
  const activeSlug =
    rawSlug && !RESERVED_TENANT_SLUGS.has(rawSlug.toLowerCase())
      ? rawSlug
      : undefined;
  const { data: tenant } = useCurrentTenantQuery(activeSlug);
  const routes = useTenantRoutes(activeSlug || tenant?.slug);

  const isPlatformRoot = routes.isPlatformRoot;
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
      className="bg-surface-card text-text-muted text-xs border-t border-surface-border mt-8 sm:mt-10 transition-colors duration-200 pb-20 xl:pb-0"
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
                    href={routes.getRastreoHref()}
                    className="hover:text-brand-primary transition-colors"
                  >
                    Rastrear mi Pedido
                  </Link>
                </li>
                <li>
                  <Link
                    href={routes.getTermsHref()}
                    className="hover:text-brand-primary transition-colors"
                  >
                    Términos del Servicio
                  </Link>
                </li>
                <li>
                  <Link
                    href={routes.getPrivacyHref()}
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

            {/* 2. Mensaje Informativo Central */}
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
        <div className="mt-3 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-[11px] text-text-subtle">
          <div className="text-center sm:text-left">
            <span>
              © {currentYear} {brandName}.
              {tenant?.taxId ? ` RUC: ${tenant.taxId}.` : ""}
            </span>{" "}
            <span className="inline-block">Todos los derechos reservados.</span>
          </div>

          <div className="flex items-center gap-4">
            <Link href={routes.getTermsHref()} className="hover:text-brand-primary transition-colors">
              Términos
            </Link>
            <Link href={routes.getPrivacyHref()} className="hover:text-brand-primary transition-colors">
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

