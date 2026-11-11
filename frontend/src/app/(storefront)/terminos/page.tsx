"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { ChevronRight, FileText, ShieldCheck, Building2, Loader2 } from "lucide-react";
import { useCurrentTenantQuery } from "@/features/tenant";
import { useTenantRoutes } from "@/shared/lib/tenant-routing";

function TerminosLegalesContent() {
  const { data: tenant } = useCurrentTenantQuery();
  const routes = useTenantRoutes(tenant?.slug);

  const brandName = tenant?.name || "Mesafy";
  const businessName = tenant?.businessName || "Mesafy Technologies S.A.S.";
  const taxId = tenant?.taxId || "1790000000001";
  const contactEmail = tenant?.contactEmail || "soporte@mesafy.app";
  const contactPhone = tenant?.contactPhone || "0990000000";
  const fee = (tenant?.baseDeliveryFee ?? 1.5).toFixed(2);

  const customContent = tenant?.termsAndConditionsMarkdown;

  return (
    <div className="w-full max-w-[1000px] mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-8">
      {/* Miga de Pan */}
      <nav aria-label="Miga de pan" className="flex items-center gap-2 text-xs font-semibold text-text-muted">
        <Link href={routes.getHomeHref()} className="hover:text-brand-primary transition-colors">
          Inicio
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-text-subtle" />
        <span className="text-text-strong font-bold">Términos y Condiciones</span>
      </nav>

      {/* Cabecera */}
      <div className="border-b border-surface-border pb-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-card border border-surface-border text-text-strong text-[11px] font-bold uppercase tracking-wider mb-2">
          <FileText className="w-3.5 h-3.5 text-brand-primary" />
          <span>Contrato de Adhesión & Términos Operativos</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-text-strong uppercase tracking-tight font-display">
          Términos y Condiciones • {brandName}
        </h1>
        <p className="text-xs sm:text-sm text-text-muted mt-1">
          Marco legal aplicable a compras en línea, despacho de alimentos y facturación electrónica SRI.
        </p>
      </div>

      {customContent ? (
        <div className="prose prose-sm max-w-none text-text-base bg-surface-card border border-surface-border rounded-3xl p-6 sm:p-10 shadow-xs whitespace-pre-line leading-relaxed">
          {customContent}
        </div>
      ) : (
        <div className="bg-surface-card border border-surface-border rounded-3xl p-6 sm:p-10 shadow-xs space-y-8 text-xs sm:text-sm text-text-base leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-black uppercase text-text-strong font-display flex items-center gap-2">
              <Building2 className="w-4 h-4 text-brand-primary" />
              <span>1. Identidad del Proveedor del Servicio</span>
            </h2>
            <p>
              El presente servicio de delivery y comercio electrónico es operado por{" "}
              <strong className="text-text-strong">{businessName}</strong>, con RUC oficial{" "}
              <strong className="text-text-strong font-mono">{taxId}</strong>, actuando comercialmente bajo la marca registrada{" "}
              <strong className="text-text-strong">{brandName}</strong>. Para efectos de reclamos, soporte o garantías, los canales oficiales son el correo{" "}
              <strong className="font-mono text-text-strong">{contactEmail}</strong> y la línea de atención{" "}
              <strong className="font-mono text-text-strong">{contactPhone}</strong>.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black uppercase text-text-strong font-display flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-primary" />
              <span>2. Cobertura Geográfica y Geocercas PostGIS</span>
            </h2>
            <p>
              Las órdenes solo son procesadas si la ubicación de destino seleccionada se encuentra dentro del polígono de cobertura georreferenciado de una sucursal activa. La tarifa de entrega base para este establecimiento inicia en{" "}
              <strong className="text-text-strong font-mono">${fee} USD</strong> y cubre los costos de transporte motorizado y empaque térmico especializado para conservar la temperatura de la brasa.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black uppercase text-text-strong font-display">
              3. Modalidades de Pago y Emisión de Comprobantes SRI
            </h2>
            <p>
              El cliente puede liquidar sus pedidos en efectivo contra entrega o mediante transferencia bancaria validada previamente por caja. Toda orden genera automáticamente factura electrónica autorizada ante el Servicio de Rentas Internas (SRI) de la República del Ecuador, la cual será enviada al correo proporcionado en el checkout.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black uppercase text-text-strong font-display">
              4. Tiempos de Preparación y Capacidad de Hornos
            </h2>
            <p>
              Para garantizar que los alimentos salgan recién asados y a temperatura segura, el establecimiento gestiona un límite de capacidad por ventanas de 20 minutos. En caso de alta demanda climática o pico de salón, el sistema informará el tiempo estimado de entrega antes de que el comensal confirme la orden.
            </p>
          </section>

          <div className="pt-4 border-t border-surface-border/60 flex flex-wrap items-center justify-between text-xs text-text-muted gap-3">
            <span>Última actualización: Noviembre 2026</span>
            <div className="flex items-center gap-4">
              <Link href={routes.getPrivacyHref()} className="hover:text-brand-primary underline">
                Ver Política de Privacidad
              </Link>
              <Link href={routes.getSucursalesHref()} className="hover:text-brand-primary underline">
                Ver Locales
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TerminosLegalesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-text-muted gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Cargando términos legales...
          </span>
        </div>
      }
    >
      <TerminosLegalesContent />
    </Suspense>
  );
}
