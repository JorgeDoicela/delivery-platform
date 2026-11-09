"use client";

import React, { useState, useEffect } from "react";
import type { TenantStorefrontConfigDto, TenantBranchSummaryDto } from "@/shared/types/api";
import { useBranchesQuery } from "../hooks/useTenantQueries";
import { getBranchOperatingStatus } from "@/shared/lib/schedule";
import { BranchMapViewer } from "./BranchMapViewer";

interface StorefrontBranchShowcaseProps {
  tenant: TenantStorefrontConfigDto | null | undefined;
}

export function StorefrontBranchShowcase({ tenant }: StorefrontBranchShowcaseProps) {
  const { data: remoteBranches } = useBranchesQuery(tenant?.slug);
  const branches: TenantBranchSummaryDto[] =
    remoteBranches && remoteBranches.length > 0
      ? remoteBranches.map((b) => ({
          id: b.id,
          name: b.name,
          address: b.address,
          phone: b.phone,
          openingTime: b.openingTime,
          closingTime: b.closingTime,
          maxOrdersPerSlot: b.maxOrdersPerSlot,
          latitude: b.latitude,
          longitude: b.longitude,
          isActive: b.isActive,
        }))
      : (tenant?.branches ?? []);

  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    // Actualización regular cada 60 segundos para vigilar en vivo la apertura y cierre
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  if (branches.length === 0) {
    return null;
  }

  const activeBranch: TenantBranchSummaryDto =
    branches.find((b) => b.id === selectedBranchId) || branches[0];

  // Limpiar cualquier prefijo residual "Matriz" para nombres amigables
  const branchDisplayName =
    activeBranch.name.replace(/^Matriz\s*/i, "").trim() || activeBranch.name;

  // Evaluación dinámica del estado operativo
  const opStatus = getBranchOperatingStatus(
    activeBranch.openingTime,
    activeBranch.closingTime,
    currentTime
  );

  // Coordenadas con fallback a Guamaní
  const lat = activeBranch.latitude || -0.33228;
  const lng = activeBranch.longitude || -78.557082;

  // Enlaces a Google Maps
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  const shortLinkUrl = "https://maps.app.goo.gl/bitq9r465t2GuHKCA";

  return (
    <section id="sucursales" className="max-w-[1240px] mx-auto w-full space-y-3 sm:space-y-6">
      {/* Encabezado Editorial Canónico: Centrado y ordenado en móvil */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2.5 sm:gap-4 text-center sm:text-left items-center sm:items-start">
        <div className="max-w-xl mx-auto sm:mx-0">
          <h3 className="text-xl sm:text-4xl font-black text-brand-primary uppercase tracking-wide font-display">
            Ubicación y Horarios de Atención
          </h3>
          <p className="text-xs sm:text-sm text-text-strong mt-0.5 sm:mt-1 leading-relaxed max-w-xl">
            Atención continua todos los días de {activeBranch.openingTime || "10:30"} a {activeBranch.closingTime || "21:30"} en nuestro local de {branchDisplayName}.
          </p>
        </div>

        {branches.length > 1 && (
          <div className="flex items-center justify-center sm:justify-start gap-2 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-full shrink-0 shadow-2xs self-center sm:self-auto">
            {branches.map((b) => {
              const isSelected = b.id === activeBranch.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelectedBranchId(b.id)}
                  className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold font-display uppercase tracking-wider transition-all ${
                    isSelected
                      ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-xs"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
        {/* Columna Izquierda: Información Editorial y Limpia (5 columnas) */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-surface-card rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-sm">
          <div className="space-y-4 sm:space-y-6">
            {/* Cabecera del Local y Estatus Tipográfico Dinámico */}
            <div className="flex items-start justify-between gap-4 pb-1 sm:pb-2">
              <div>
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-text-muted block mb-0.5 sm:mb-1 font-display">
                  Nuestro Local
                </span>
                <h4 className="text-xl sm:text-3xl font-black text-text-strong uppercase tracking-tight font-display">
                  {branchDisplayName}
                </h4>
              </div>

              {!activeBranch.isActive ? (
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-text-muted font-display shrink-0 mt-1">
                  Pausada Temporalmente
                </span>
              ) : opStatus.isOpen ? (
                opStatus.isClosingSoon ? (
                  <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 font-display shrink-0 mt-1">
                    Cierra Pronto
                  </span>
                ) : (
                  <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-display shrink-0 mt-1">
                    Abierto Ahora
                  </span>
                )
              ) : (
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-text-muted font-display shrink-0 mt-1">
                  Cerrado Actualmente
                </span>
              )}
            </div>

            {/* Datos Directos en Tipografía Pura (Sin Cajas Anidadas) */}
            <div className="space-y-3.5 sm:space-y-5 text-text-strong">
              {/* Dirección */}
              <div>
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-0.5 sm:mb-1">
                  Dirección Exacta
                </span>
                <p className="font-bold text-text-strong leading-snug text-sm sm:text-base">
                  {activeBranch.address}
                </p>
                <p className="text-[11px] sm:text-xs text-text-muted mt-0.5 sm:mt-1">
                  Sector {branchDisplayName} • A 2 cuadras de la Av. Maldonado (Quito Sur)
                </p>
              </div>

              {/* Horario y Contacto */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-1">
                <div>
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-0.5 sm:mb-1">
                    Horario de Atención
                  </span>
                  <p className="font-bold text-text-strong font-mono text-xs sm:text-sm">
                    {activeBranch.openingTime} - {activeBranch.closingTime}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-text-muted mt-0.5">
                    {opStatus.isOpen ? "Lunes a domingo • En servicio" : opStatus.detailLabel}
                  </p>
                </div>

                <div>
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-0.5 sm:mb-1">
                    Atención Directa
                  </span>
                  {activeBranch.phone ? (
                    <a
                      href={`tel:${activeBranch.phone}`}
                      className="font-bold text-text-strong font-mono text-xs sm:text-sm hover:text-brand-primary transition-colors block"
                    >
                      {activeBranch.phone}
                    </a>
                  ) : (
                    <p className="font-bold text-text-strong text-xs sm:text-sm">
                      En Local y en Línea
                    </p>
                  )}
                  <p className="text-[10px] sm:text-[11px] text-text-muted mt-0.5">
                    {opStatus.isOpen ? "Línea activa" : "Recepción diferida"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Botones de Acción Canónicos (rounded-full) */}
          <div className="pt-3 sm:pt-4 mt-3 sm:mt-4 flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
            <a
              href={shortLinkUrl || googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:flex-1 inline-flex items-center justify-center bg-brand-primary hover:bg-brand-primary-hover text-white text-[11px] sm:text-xs font-black font-display uppercase tracking-wider px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-full shadow-sm sm:shadow-md transition-all active:scale-95 text-center"
            >
              Cómo Llegar en Maps
            </a>

            <a
              href="#catalogo"
              className="w-full sm:w-auto inline-flex items-center justify-center bg-surface-canvas hover:bg-surface-card-hover text-text-strong text-[11px] sm:text-xs font-bold font-display uppercase tracking-wider px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-full shadow-2xs hover:shadow-xs transition-all active:scale-95 text-center"
            >
              {opStatus.isOpen ? "Ver Menú & Ordenar" : "Ver Menú"}
            </a>
          </div>
        </div>

        {/* Columna Derecha: Vista Cartográfica Interactiva Vectorial con MapLibre GL JS */}
        <div className="lg:col-span-7 rounded-2xl sm:rounded-3xl overflow-hidden bg-surface-canvas relative min-h-[260px] sm:min-h-[380px] lg:min-h-[460px] shadow-sm flex flex-col">
          <BranchMapViewer
            branchName={branchDisplayName}
            address={activeBranch.address}
            latitude={lat}
            longitude={lng}
            imageUrl="/images/tenants/la-granjita/banners/promo-hecho-a-la-brasa.jpg"
            googleMapsUrl={shortLinkUrl || googleMapsUrl}
          />
        </div>
      </div>
    </section>
  );
}
