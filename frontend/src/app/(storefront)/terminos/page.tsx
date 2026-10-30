"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, FileText, ShieldCheck, Building2 } from "lucide-react";
import { useCurrentTenantQuery } from "@/features/tenant";

export default function TerminosLegalesPage() {
  const { data: tenant } = useCurrentTenantQuery();

  const brandName = tenant?.name || "La Granjita Asadero";
  const businessName = tenant?.businessName || "Asadero La Granjita Cia. Ltda.";
  const taxId = tenant?.taxId || "1754455341001";
  const contactEmail = tenant?.contactEmail || "pedidos@lagranjita.com";
  const contactPhone = tenant?.contactPhone || "0987654321";
  const fee = (tenant?.baseDeliveryFee ?? 1.5).toFixed(2);

  const customContent = tenant?.termsAndConditionsMarkdown;

  return (
    <div className="w-full max-w-[1000px] mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-8">
      {/* Miga de Pan */}
      <nav aria-label="Miga de pan" className="flex items-center gap-2 text-xs font-semibold text-neutral-500">
        <Link href="/" className="hover:text-brand-primary transition-colors">
          Inicio
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
        <span className="text-neutral-900 font-bold">Términos y Condiciones</span>
      </nav>

      {/* Cabecera */}
      <div className="border-b border-neutral-200 pb-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 text-neutral-700 text-[11px] font-bold uppercase tracking-wider mb-2">
          <FileText className="w-3.5 h-3.5 text-brand-primary" />
          <span>Contrato de Adhesión & Términos Operativos</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-neutral-950 uppercase tracking-tight font-display">
          Términos y Condiciones • {brandName}
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          Marco legal aplicable a compras en línea, despacho de alimentos y facturación electrónica SRI.
        </p>
      </div>

      {customContent ? (
        <div className="prose prose-sm max-w-none text-neutral-700 bg-white border border-neutral-200 rounded-3xl p-6 sm:p-10 shadow-xs whitespace-pre-line leading-relaxed">
          {customContent}
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-10 shadow-xs space-y-8 text-xs sm:text-sm text-neutral-700 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-black uppercase text-neutral-950 font-display flex items-center gap-2">
              <Building2 className="w-4 h-4 text-brand-primary" />
              <span>1. Identidad del Proveedor del Servicio</span>
            </h2>
            <p>
              El presente servicio de delivery y comercio electrónico es operado por{" "}
              <strong className="text-neutral-950">{businessName}</strong>, con RUC oficial{" "}
              <strong className="text-neutral-950 font-mono">{taxId}</strong>, actuando comercialmente bajo la marca registrada{" "}
              <strong className="text-neutral-950">{brandName}</strong>. Para efectos de reclamos, soporte o garantías, los canales oficiales son el correo{" "}
              <strong className="font-mono text-neutral-950">{contactEmail}</strong> y la línea de atención{" "}
              <strong className="font-mono text-neutral-950">{contactPhone}</strong>.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black uppercase text-neutral-950 font-display flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-primary" />
              <span>2. Cobertura Geográfica y Geocercas PostGIS</span>
            </h2>
            <p>
              Las órdenes solo son procesadas si la ubicación de destino seleccionada se encuentra dentro del polígono de cobertura georreferenciado de una sucursal activa. La tarifa de entrega base para este establecimiento inicia en{" "}
              <strong className="text-neutral-950 font-mono">${fee} USD</strong> y cubre los costos de transporte motorizado y empaque térmico especializado para conservar la temperatura de la brasa.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black uppercase text-neutral-950 font-display">
              3. Modalidades de Pago y Emisión de Comprobantes SRI
            </h2>
            <p>
              El cliente puede liquidar sus pedidos en efectivo contra entrega o mediante transferencia bancaria validada previamente por caja. Toda orden genera automáticamente factura electrónica autorizada ante el Servicio de Rentas Internas (SRI) de la República del Ecuador, la cual será enviada al correo proporcionado en el checkout.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black uppercase text-neutral-950 font-display">
              4. Tiempos de Preparación y Capacidad de Hornos
            </h2>
            <p>
              Para garantizar que los alimentos salgan recién asados y a temperatura segura, el establecimiento gestiona un límite de capacidad por ventanas de 20 minutos. En caso de alta demanda climática o pico de salón, el sistema informará el tiempo estimado de entrega antes de que el comensal confirme la orden.
            </p>
          </section>

          <div className="pt-4 border-t border-neutral-100 flex flex-wrap items-center justify-between text-xs text-neutral-400 gap-3">
            <span>Última actualización: Octubre 2026</span>
            <div className="flex items-center gap-4">
              <Link href="/privacidad" className="hover:text-brand-primary underline">
                Ver Política de Privacidad
              </Link>
              <Link href="/sucursales" className="hover:text-brand-primary underline">
                Ver Locales
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

