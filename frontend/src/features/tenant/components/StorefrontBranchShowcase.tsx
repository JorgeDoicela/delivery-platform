"use client";

import React, { useState } from "react";
import type { TenantStorefrontConfigDto, TenantBranchSummaryDto } from "@/shared/types/api";

interface StorefrontBranchShowcaseProps {
  tenant: TenantStorefrontConfigDto | null | undefined;
}

export function StorefrontBranchShowcase({ tenant }: StorefrontBranchShowcaseProps) {
  const branches = tenant?.branches ?? [];
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);

  if (branches.length === 0) {
    return null;
  }

  const activeBranch: TenantBranchSummaryDto =
    branches.find((b) => b.id === selectedBranchId) || branches[0];

  // Limpiar cualquier prefijo residual "Matriz" para nombres amigables
  const branchDisplayName =
    activeBranch.name.replace(/^Matriz\s*/i, "").trim() || activeBranch.name;

  // Coordenadas con fallback a Guamaní
  const lat = activeBranch.latitude || -0.33228;
  const lng = activeBranch.longitude || -78.557082;

  // Enlaces a Google Maps
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  const shortLinkUrl = "https://maps.app.goo.gl/bitq9r465t2GuHKCA";

  // Bounding box para OpenStreetMap
  const bbox = `${lng - 0.007}%2C${lat - 0.0045}%2C${lng + 0.007}%2C${lat + 0.0045}`;
  const embedMapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;

  return (
    <section id="sucursales" className="max-w-[1240px] mx-auto pt-10 w-full space-y-6">
      {/* Encabezado Editorial Canónico */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-4 border-b border-surface-border gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-brand-primary block mb-1 font-sans">
            Dónde Encontrarnos
          </span>
          <h3 className="text-3xl sm:text-4xl font-black text-text-strong uppercase tracking-wide font-display">
            Ven a Comer al Local o Pide a Domicilio
          </h3>
          <p className="text-xs sm:text-sm text-text-muted mt-1 leading-relaxed">
            Te esperamos en nuestro restaurante en Guamaní para almorzar o cenar en familia, o pide en línea y te lo llevamos calientito directo a tu puerta.
          </p>
        </div>

        {branches.length > 1 && (
          <div className="flex items-center gap-2 bg-neutral-100 p-1 rounded-full border border-neutral-200 shrink-0">
            {branches.map((b) => {
              const isSelected = b.id === activeBranch.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelectedBranchId(b.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold font-display uppercase tracking-wider transition-all ${
                    isSelected
                      ? "bg-neutral-900 text-white shadow-xs"
                      : "text-neutral-600 hover:text-neutral-900"
                  }`}
                >
                  {b.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Tarjeta Principal Showcase 2 Columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Columna Izquierda: Información Editorial y Limpia (5 columnas) */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-white border border-neutral-200/90 rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="space-y-6">
            {/* Cabecera del Local y Estatus Tipográfico */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-neutral-100">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 block mb-1">
                  Nuestro Local
                </span>
                <h4 className="text-3xl font-black text-neutral-900 uppercase tracking-tight font-display">
                  {branchDisplayName}
                </h4>
              </div>

              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 font-display shrink-0 mt-1">
                Abierto Ahora
              </span>
            </div>

            {/* Datos Directos en Tipografía Pura (Sin Cajas Anidadas) */}
            <div className="space-y-5 text-neutral-700">
              {/* Dirección */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                  Dirección Exacta
                </span>
                <p className="font-bold text-neutral-900 leading-snug text-base">
                  {activeBranch.address}
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  Sector Guamaní • A 2 cuadras de la Av. Maldonado (Quito Sur)
                </p>
              </div>

              {/* Horario y Contacto */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                    Horario de Atención
                  </span>
                  <p className="font-bold text-neutral-900 font-mono text-sm">
                    {activeBranch.openingTime} - {activeBranch.closingTime}
                  </p>
                  <p className="text-[11px] text-neutral-500 mt-0.5">Lunes a domingo</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                    {activeBranch.phone && activeBranch.phone !== "0987654321" ? "Pedidos Telefónicos" : "Atención"}
                  </span>
                  {activeBranch.phone && activeBranch.phone !== "0987654321" ? (
                    <a
                      href={`tel:${activeBranch.phone}`}
                      className="font-bold text-neutral-900 font-mono text-sm hover:text-brand-primary transition-colors block"
                    >
                      {activeBranch.phone}
                    </a>
                  ) : (
                    <p className="font-bold text-neutral-900 text-sm">
                      En Local y en Línea
                    </p>
                  )}
                  <p className="text-[11px] text-neutral-500 mt-0.5">Atención directa</p>
                </div>
              </div>

              {/* Modalidades en Píldoras Neutras Limpias */}
              <div className="pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">
                  Modalidades de Atención
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3.5 py-1.5 rounded-full bg-neutral-100 border border-neutral-200/70 text-xs font-semibold text-neutral-800">
                    Consumo en Salón
                  </span>
                  <span className="px-3.5 py-1.5 rounded-full bg-neutral-100 border border-neutral-200/70 text-xs font-semibold text-neutral-800">
                    Para Llevar
                  </span>
                  <span className="px-3.5 py-1.5 rounded-full bg-neutral-100 border border-neutral-200/70 text-xs font-semibold text-neutral-800">
                    A Domicilio
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Botones de Acción Canónicos (rounded-full) */}
          <div className="pt-6 mt-6 border-t border-neutral-100 flex flex-col sm:flex-row items-center gap-3">
            <a
              href={shortLinkUrl || googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:flex-1 inline-flex items-center justify-center bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-black font-display uppercase tracking-wider px-6 py-3.5 rounded-full shadow-md transition-all active:scale-95 text-center"
            >
              Cómo Llegar en Maps
            </a>

            <a
              href="#catalogo"
              className="w-full sm:w-auto inline-flex items-center justify-center bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-xs font-bold font-display uppercase tracking-wider px-6 py-3.5 rounded-full transition-all active:scale-95 text-center"
            >
              Ver Menú
            </a>
          </div>
        </div>

        {/* Columna Derecha: Vista Cartográfica Limpia (7 columnas) */}
        <div className="lg:col-span-7 rounded-3xl border border-neutral-200/90 overflow-hidden bg-neutral-100 relative min-h-[380px] lg:min-h-[460px] shadow-xs flex flex-col">
          <iframe
            title={`Ubicación de ${activeBranch.name}`}
            src={embedMapUrl}
            className="w-full h-full min-h-[380px] lg:min-h-[460px] border-0"
            loading="lazy"
          />

          {/* Botón Flotante Canónico */}
          <a
            href={shortLinkUrl || googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-4 right-4 inline-flex items-center px-5 py-2.5 rounded-full bg-neutral-950/90 hover:bg-neutral-900 text-white text-xs font-bold font-display uppercase tracking-wider transition-all shadow-lg active:scale-95 backdrop-blur-sm"
          >
            Abrir en Google Maps
          </a>
        </div>
      </div>
    </section>
  );
}
