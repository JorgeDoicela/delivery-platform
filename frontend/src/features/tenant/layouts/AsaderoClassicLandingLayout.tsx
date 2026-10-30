"use client";

import React from "react";
import Link from "next/link";
import {
  CatalogHero,
  OrderModeSelector,
  PromotionalBanners,
  CatalogSection,
} from "@/features/catalog";
import type { TenantStorefrontConfigDto } from "@/shared/types/api";

interface AsaderoClassicLandingLayoutProps {
  tenant: TenantStorefrontConfigDto | null | undefined;
}

export function AsaderoClassicLandingLayout({
  tenant,
}: AsaderoClassicLandingLayoutProps) {
  const heroSubtitle =
    tenant?.heroSubtitle ||
    "Personaliza tu orden con guarniciones calientes, ensalada fresca y ají artesanal";
  const quickLinksEnabled = tenant?.quickLinksEnabled ?? true;

  return (
    <div className="w-full pb-12 space-y-12">
      {/* 1. Hero Slider de Asadero Panorámico */}
      <CatalogHero />

      <div className="w-full px-4 sm:px-8 lg:px-12 space-y-12">
        {/* 2. Selector de Modalidad (Delivery / Salón / Takeout) */}
        <OrderModeSelector />

        {/* 3. Banners Promocionales de Asador y Marinado a la Brasa */}
        <PromotionalBanners />

        {/* 4. Menú y Combos del Asadero */}
        <section
          id="catalogo"
          className="max-w-[1240px] mx-auto space-y-6 pt-6 w-full"
        >
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-brand-primary block mb-1">
                Especialidades al Carbón
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-text-strong uppercase tracking-wide font-display" suppressHydrationWarning>
                Menú y Combos • {tenant?.name ?? "Asadero"}
              </h2>
              <p className="text-xs sm:text-sm text-text-muted mt-0.5" suppressHydrationWarning>
                {heroSubtitle}
              </p>
            </div>
          </div>

          <CatalogSection />

          {/* 5. Accesos Directos Operativos (si están habilitados) */}
          {quickLinksEnabled && (
            <div className="pt-8 border-t border-surface-border space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-text-strong uppercase tracking-wide font-display">
                    Accesos Directos del Sistema ({tenant?.name})
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    Navegación rápida a todas las pantallas operativas y personalización multi-tenant
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="bg-white border border-neutral-200 rounded-3xl p-5 space-y-3 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
                    Tienda & Clientes
                  </span>
                  <div className="flex flex-col gap-2">
                    <Link
                      href="/catalogo"
                      className="flex items-center justify-between px-4 py-2.5 rounded-full border border-neutral-200 hover:border-brand-primary hover:text-brand-primary text-xs font-black uppercase tracking-wider font-display transition-colors bg-neutral-50 hover:bg-neutral-100"
                    >
                      <span>Catálogo Completo</span>
                      <span className="text-[10px] text-neutral-400 font-mono">/catalogo</span>
                    </Link>
                    <Link
                      href="/sucursales"
                      className="flex items-center justify-between px-4 py-2.5 rounded-full border border-neutral-200 hover:border-brand-primary hover:text-brand-primary text-xs font-black uppercase tracking-wider font-display transition-colors bg-neutral-50 hover:bg-neutral-100"
                    >
                      <span>Sucursales & Horarios</span>
                      <span className="text-[10px] text-neutral-400 font-mono">/sucursales</span>
                    </Link>
                    <Link
                      href="/finalizar-pedido"
                      className="flex items-center justify-between px-4 py-2.5 rounded-full border border-neutral-200 hover:border-brand-primary hover:text-brand-primary text-xs font-black uppercase tracking-wider font-display transition-colors bg-neutral-50 hover:bg-neutral-100"
                    >
                      <span>Finalizar Pedido / Checkout</span>
                      <span className="text-[10px] text-neutral-400 font-mono">/finalizar-pedido</span>
                    </Link>
                  </div>
                </div>

                <div className="bg-neutral-950 text-white rounded-3xl p-5 space-y-3 shadow-md border border-neutral-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                    Cocina, Marca & Administración
                  </span>
                  <div className="flex flex-col gap-2">
                    <Link
                      href="/admin/personalizacion"
                      className="flex items-center justify-between px-4 py-2.5 rounded-full border border-brand-primary bg-brand-primary/15 hover:bg-brand-primary text-xs font-black uppercase tracking-wider font-display transition-colors text-white"
                    >
                      <span>Personalizar Landing & Marca</span>
                      <span className="text-[10px] text-amber-300 font-mono font-bold">/admin/personalizacion</span>
                    </Link>
                    <Link
                      href="/login"
                      className="flex items-center justify-between px-4 py-2.5 rounded-full border border-neutral-800 hover:border-brand-primary hover:bg-neutral-900 text-xs font-black uppercase tracking-wider font-display transition-colors text-white"
                    >
                      <span>Portal de Acceso (Login)</span>
                      <span className="text-[10px] text-brand-primary font-mono font-bold">/login</span>
                    </Link>
                    <Link
                      href="/cocina"
                      className="flex items-center justify-between px-4 py-2.5 rounded-full border border-neutral-800 hover:border-brand-primary hover:bg-neutral-900 text-xs font-black uppercase tracking-wider font-display transition-colors text-white"
                    >
                      <span>Terminal Cocina (KDS)</span>
                      <span className="text-[10px] text-neutral-400 font-mono">/cocina</span>
                    </Link>
                  </div>
                </div>

                <div className="bg-white border border-neutral-200 rounded-3xl p-5 space-y-3 shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
                      Repartidor en Ruta
                    </span>
                    <div className="flex flex-col gap-2 mt-3">
                      <Link
                        href="/repartidor"
                        className="flex items-center justify-between px-4 py-2.5 rounded-full border border-neutral-200 hover:border-brand-primary hover:text-brand-primary text-xs font-black uppercase tracking-wider font-display transition-colors bg-neutral-50 hover:bg-neutral-100"
                      >
                        <span>App Móvil de Repartidor</span>
                        <span className="text-[10px] text-neutral-400 font-mono">/repartidor</span>
                      </Link>
                    </div>
                  </div>
                  <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-[11px] text-neutral-500 space-y-1">
                    <p className="font-bold text-neutral-700">Plantilla: Asadero Clásico</p>
                    <p className="font-mono text-[10px] text-neutral-600">
                      Slug: {tenant?.slug} • Envío base: ${(tenant?.baseDeliveryFee ?? 1.5).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

