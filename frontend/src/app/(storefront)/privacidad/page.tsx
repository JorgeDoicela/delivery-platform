"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Shield, Lock, MapPin, Database } from "lucide-react";
import { useCurrentTenantQuery } from "@/features/tenant";

export default function PoliticaPrivacidadPage() {
  const { data: tenant } = useCurrentTenantQuery();

  const brandName = tenant?.name || "La Granjita Asadero";
  const businessName = tenant?.businessName || "Asadero La Granjita Cia. Ltda.";
  const taxId = tenant?.taxId || "1754455341001";
  const contactEmail = tenant?.contactEmail || "pedidos@lagranjita.com";

  const customContent = tenant?.privacyPolicyMarkdown;

  return (
    <div className="w-full max-w-[1000px] mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-8">
      {/* Miga de Pan */}
      <nav aria-label="Miga de pan" className="flex items-center gap-2 text-xs font-semibold text-neutral-500">
        <Link href="/" className="hover:text-brand-primary transition-colors">
          Inicio
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
        <span className="text-neutral-900 font-bold">Privacidad</span>
      </nav>

      {/* Cabecera */}
      <div className="border-b border-neutral-200 pb-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold uppercase tracking-wider mb-2 border border-emerald-200">
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span>Protección de Datos Personales & Geolocalización</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-neutral-950 uppercase tracking-tight font-display">
          Política de Privacidad • {brandName}
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          Tratamiento ético y cifrado de datos de entrega, facturación y telemetría de despacho.
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
              <Database className="w-4 h-4 text-emerald-600" />
              <span>1. Responsable del Tratamiento de Datos</span>
            </h2>
            <p>
              El responsable del almacenamiento y custodia de tus datos es{" "}
              <strong className="text-neutral-950">{businessName}</strong> (RUC{" "}
              <strong className="text-neutral-950 font-mono">{taxId}</strong>), operando la marca comercial{" "}
              <strong className="text-neutral-950">{brandName}</strong>. Ante cualquier requerimiento de acceso, rectificación o eliminación de tus registros, puedes dirigirte a{" "}
              <strong className="font-mono text-neutral-950">{contactEmail}</strong>.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black uppercase text-neutral-950 font-display flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>2. Uso de Coordenadas GPS y Datos de Entrega</span>
            </h2>
            <p>
              La ubicación geográfica ingresada en el checkout es utilizada exclusivamente para:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Verificar que tu dirección se encuentre dentro de la geocerca de la sucursal más cercana.</li>
              <li>Calcular la distancia de ruta óptima para el repartidor motorizado.</li>
              <li>Transmitir la posición en tiempo real al cliente a través del mapa satelital del pedido.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black uppercase text-neutral-950 font-display flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>3. Cero Comercialización a Terceros</span>
            </h2>
            <p>
              Tus números telefónicos, direcciones domiciliarias e identificaciones tributarias no son vendidas, cedidas ni compartidas con centrales de publicidad. Su uso está estrictamente restringido a la emisión del comprobante SRI y al contacto logístico durante la entrega.
            </p>
          </section>

          <div className="pt-4 border-t border-neutral-100 flex flex-wrap items-center justify-between text-xs text-neutral-400 gap-3">
            <span>Conforme a la Ley Orgánica de Protección de Datos Personales (LOPDP Ecuador)</span>
            <div className="flex items-center gap-4">
              <Link href="/terminos" className="hover:text-brand-primary underline">
                Ver Términos y Condiciones
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

