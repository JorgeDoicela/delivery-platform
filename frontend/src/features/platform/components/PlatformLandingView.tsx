"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MapPin } from "lucide-react";
import { usePublicTenantsQuery } from "@/features/tenant";
import { useTenantStore } from "@/features/tenant/store/useTenantStore";
import { PlatformAffiliationSection } from "./PlatformAffiliationSection";

const TENANT_COVER_IMAGES: Record<string, string> = {
  "la-granjita": "/images/tenants/la-granjita/banners/hero-combo-familiar.jpg",
  "brasas-del-valle": "/images/tenants/brasas-del-valle/banners/promo-hecho-a-la-brasa.jpg",
};

export function PlatformLandingView() {
  const { data } = usePublicTenantsQuery();
  const setTenantSlug = useTenantStore((s) => s.setTenantSlug);
  const tenants = data?.tenants ?? [];

  return (
    <div className="w-full pb-16 space-y-14 bg-surface-canvas">
      {/* 1. Hero Panorámico a Ancho Completo (Principio Canónico 4.2 de delivery-estilos) */}
      <section className="relative overflow-hidden w-full min-h-[480px] sm:min-h-[530px] md:min-h-[580px] bg-neutral-950 text-white shadow-xl flex items-center py-14 sm:py-18 px-6 sm:px-12 md:px-16 lg:px-20">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/platform/hero-platform.jpg"
            alt="Ecosistema de Restaurantes y Delivery en Línea"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center md:object-right"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/75 to-transparent sm:from-black/90 sm:via-black/60 md:to-black/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
        </div>

        <div className="relative z-10 w-full max-w-2xl space-y-6">
          <div className="inline-flex items-center bg-brand-primary text-white px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-md">
            <span>ECOSISTEMA GASTRONÓMICO MULTI-MARCA</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight leading-none text-white drop-shadow-md font-display">
            PEDIDOS DIRECTOS A TU RESTAURANTE FAVORITO
          </h1>

          <p className="text-white/90 text-sm sm:text-base leading-relaxed font-medium drop-shadow max-w-xl">
            Selecciona tu restaurante o franquicia favorita, verifica cobertura satelital exacta y recibe tu orden recién preparada en casa o recógela en el local.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <a
              href="#restaurantes"
              className="inline-flex items-center gap-2 bg-brand-primary hover:bg-brand-primary-hover text-white font-black text-xs sm:text-sm uppercase tracking-wider font-display px-8 py-4 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95"
            >
              <span>ELEGIR RESTAURANTE</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </a>

            <a
              href="#afiliacion"
              className="inline-flex items-center gap-2 bg-black/40 hover:bg-black/60 text-white font-bold text-xs uppercase tracking-wider px-6 py-4 rounded-full border border-white/30 transition-all backdrop-blur-md shadow-md active:scale-95"
            >
              <MapPin className="w-4 h-4 text-amber-300" />
              <span>AFILIAR MI RESTAURANTE</span>
            </a>
          </div>
        </div>
      </section>

      <div className="w-full px-4 sm:px-8 lg:px-12 space-y-14">
        {/* 2. Selector Rápido de Acción en Plataforma (Principio Canónico 4.3 de delivery-estilos) */}
        <section className="w-full text-center py-2">
          <div className="max-w-[760px] mx-auto space-y-4">
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wide text-neutral-900 font-display">
              ¿QUÉ TE GUSTARÍA HACER HOY?
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 w-full">
              <a
                href="#restaurantes"
                className="group relative overflow-hidden py-5 px-5 sm:py-6 sm:px-6 rounded-2xl sm:rounded-3xl flex items-center justify-between text-left transition-all active:scale-95 bg-brand-primary hover:bg-brand-primary-hover text-white shadow-lg"
              >
                <div>
                  <span className="text-xs font-bold tracking-wider uppercase text-white/90 block leading-tight">
                    DIRECTORIO DE TIENDAS
                  </span>
                  <span className="text-lg sm:text-2xl font-black uppercase tracking-tight block leading-tight text-white font-display mt-0.5">
                    PEDIR EN UN RESTAURANTE
                  </span>
                </div>
                <ArrowRight className="w-5 h-5 text-white shrink-0 group-hover:translate-x-1 transition-transform" />
              </a>

              <Link
                href="/superadmin"
                className="group relative overflow-hidden py-5 px-5 sm:py-6 sm:px-6 rounded-2xl sm:rounded-3xl flex items-center justify-between text-left transition-all active:scale-95 bg-neutral-950 hover:bg-neutral-900 text-white shadow-lg"
              >
                <div>
                  <span className="text-xs font-bold tracking-wider uppercase text-amber-400 block leading-tight">
                    CONSOLA MULTI-TENANT
                  </span>
                  <span className="text-lg sm:text-2xl font-black uppercase tracking-tight block leading-tight text-white font-display mt-0.5">
                    GESTIONAR ESTABLECIMIENTOS
                  </span>
                </div>
                <ArrowRight className="w-5 h-5 text-white shrink-0 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </section>

        {/* 3. Directorio de Establecimientos Afiliados con Anatomía de ProductCard (Principio Canónico 4.5 y 4.6) */}
        <section
          id="restaurantes"
          className="max-w-[1240px] mx-auto space-y-6 scroll-mt-24 w-full"
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-3 border-b border-neutral-200 gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-brand-primary block mb-1">
                DIRECTORIO OFICIAL MULTI-TENANT
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-neutral-950 uppercase tracking-wide font-display">
                ESTABLECIMIENTOS AFILIADOS ({tenants.length})
              </h2>
              <p className="text-xs sm:text-sm text-neutral-600 mt-0.5">
                Cada restaurante opera su propio menú en línea, precios, promociones, sucursales y cocina en tiempo real
              </p>
            </div>

            <Link
              href="/superadmin"
              className="inline-flex items-center justify-center bg-white hover:bg-neutral-50 text-neutral-900 border border-neutral-300 text-xs font-black uppercase tracking-wider font-display px-5 py-2.5 rounded-full transition-colors shrink-0"
            >
              + AFILIAR NUEVO LOCAL
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {tenants.map((t) => {
              const coverImage =
                TENANT_COVER_IMAGES[t.slug] ||
                "/images/shared/placeholders/dish-default.webp";

              return (
                <article
                  key={t.slug}
                  className="group relative flex flex-col justify-between bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-neutral-300 transition-all duration-300"
                >
                  <div>
                    {/* Cabecera Fotográfica con Badges Flotantes (Backdrop Blur) */}
                    <div className="relative w-full aspect-[16/10] bg-neutral-100 overflow-hidden">
                      <Image
                        src={coverImage}
                        alt={t.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />

                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-900 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full shadow-sm">
                          {t.tagline}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-black/65 backdrop-blur-md px-2.5 py-1 rounded-full shadow-sm">
                          {t.activeBranchesCount}{" "}
                          {t.activeBranchesCount === 1 ? "SUCURSAL" : "SUCURSALES"}
                        </span>
                      </div>

                      <div
                        className="absolute bottom-0 left-0 right-0 h-1.5"
                        style={{ backgroundColor: t.brandPrimaryColor }}
                      />
                    </div>

                    {/* Información del Establecimiento */}
                    <div className="p-5 sm:p-6 space-y-2">
                      <div className="flex items-center gap-2.5">
                        <div className="relative w-7 h-7 rounded-lg bg-neutral-50 border border-neutral-200 p-0.5 shrink-0 overflow-hidden">
                          <Image
                            src={t.logoUrl || "/images/shared/placeholders/logo-default.png"}
                            alt={`Logo ${t.name}`}
                            width={28}
                            height={28}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <h3 className="text-xl font-black text-neutral-900 group-hover:text-brand-primary transition-colors uppercase tracking-tight leading-tight font-display">
                          {t.name}
                        </h3>
                      </div>

                      <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                        {t.description}
                      </p>

                      <p className="text-[11px] text-neutral-500 font-medium flex items-center gap-1 pt-1 truncate">
                        <MapPin className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                        <span className="truncate">{t.primaryBranchAddress}</span>
                      </p>
                    </div>
                  </div>

                  {/* Fila Inferior de Tarifa Base y Acción Comercial */}
                  <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-3 border-t border-neutral-100 flex items-center justify-between mt-auto">
                    <div>
                      <span className="text-[10px] text-neutral-500 block uppercase font-bold tracking-wider">
                        ENVÍO BASE
                      </span>
                      <span className="text-2xl font-black text-neutral-950 tracking-tight tabular-nums font-mono">
                        ${t.baseDeliveryFee.toFixed(2).replace(".", ",")}
                      </span>
                    </div>

                    <Link
                      href={`/${t.slug}`}
                      onClick={() => setTenantSlug(t.slug)}
                      className="inline-flex items-center justify-center bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-black uppercase tracking-wider font-display py-3 px-6 rounded-full shadow-md transition-all hover:scale-105 active:scale-95"
                      style={{ backgroundColor: t.brandPrimaryColor }}
                    >
                      <span>VER TIENDA</span>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* 4. Banners de Arquitectura Operativa a 2 Columnas (Principio Canónico 4.4 de delivery-estilos) */}
        <section className="w-full py-2">
          <div className="max-w-[1240px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 flex flex-col justify-between text-white shadow-lg min-h-[280px] sm:min-h-[320px] group bg-neutral-950 border border-white/20">
              <div className="absolute inset-0 z-0">
                <Image
                  src="/images/tenants/la-granjita/banners/promo-receta-tradicional.jpg"
                  alt="Personalización Multi-Tenant"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-black/25" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              </div>

              <div className="space-y-3 relative z-10 max-w-md sm:max-w-lg">
                <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight leading-tight text-white drop-shadow-md font-display">
                  IDENTIDAD Y CATÁLOGO INDEPENDIENTE POR MARCA
                </h3>
                <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-medium drop-shadow">
                  Cada establecimiento configura su logotipo, paleta de colores, fotos de productos, banners promocionales y cuentas bancarias de forma aislada.
                </p>
              </div>

              <div className="pt-6 relative z-10">
                <Link
                  href="/admin/personalizacion"
                  className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider font-display px-6 py-3 rounded-full transition-all shadow-md active:scale-95 hover:scale-105 bg-brand-primary hover:bg-brand-primary-hover text-white"
                >
                  <span>PERSONALIZAR MARCA</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 flex flex-col justify-between text-white shadow-lg min-h-[280px] sm:min-h-[320px] group bg-neutral-950 border border-white/20">
              <div className="absolute inset-0 z-0">
                <Image
                  src="/images/tenants/la-granjita/banners/promo-hecho-a-la-brasa.jpg"
                  alt="Cocina KDS y Geocercas PostGIS"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-black/25" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              </div>

              <div className="space-y-3 relative z-10 max-w-md sm:max-w-lg">
                <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight leading-tight text-white drop-shadow-md font-display">
                  TERMINALES KDS EN COCINA Y GEOCERCAS POSTGIS
                </h3>
                <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-medium drop-shadow">
                  Control de capacidad de cocina cada 20 minutos en Redis, recepción de comandas en tiempo real por SignalR y validación espacial de cobertura.
                </p>
              </div>

              <div className="pt-6 relative z-10">
                <Link
                  href="/cocina"
                  className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider font-display px-6 py-3 rounded-full transition-all shadow-md active:scale-95 hover:scale-105 bg-white hover:bg-neutral-100 text-brand-primary"
                >
                  <span>ABRIR TERMINAL KDS</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Portal de Afiliación en Cuadrícula Asimétrica 4/8 */}
        <PlatformAffiliationSection />
      </div>
    </div>
  );
}
