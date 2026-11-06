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
    <section id="sucursales" className="max-w-[1240px] mx-auto pt-10 w-full space-y-6">
      {/* Encabezado Editorial Canónico */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-brand-primary block mb-1 font-sans">
            Dónde Encontrarnos
          </span>
          <h3 className="text-3xl sm:text-4xl font-black text-text-strong uppercase tracking-wide font-display">
            Ven a Comer al Local o Pide a Domicilio
          </h3>
          <p className="text-xs sm:text-sm text-text-muted mt-1 leading-relaxed">
            Te esperamos en nuestro restaurante en {branchDisplayName} para almorzar o cenar en familia, o pide en línea y te lo llevamos calientito directo a tu puerta.
          </p>
        </div>

        {branches.length > 1 && (
          <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-full border border-neutral-200 dark:border-neutral-700 shrink-0">
            {branches.map((b) => {
              const isSelected = b.id === activeBranch.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelectedBranchId(b.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold font-display uppercase tracking-wider transition-all ${
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Columna Izquierda: Información Editorial y Limpia (5 columnas) */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-surface-card border border-surface-border rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="space-y-6">
            {/* Cabecera del Local y Estatus Tipográfico Dinámico */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-surface-border">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-text-muted block mb-1 font-display">
                  Nuestro Local
                </span>
                <h4 className="text-3xl font-black text-text-strong uppercase tracking-tight font-display">
                  {branchDisplayName}
                </h4>
              </div>

              {!activeBranch.isActive ? (
                <span className="text-xs font-bold uppercase tracking-wider text-text-muted font-display shrink-0 mt-1">
                  Pausada Temporalmente
                </span>
              ) : opStatus.isOpen ? (
                opStatus.isClosingSoon ? (
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 font-display shrink-0 mt-1">
                    Cierra Pronto
                  </span>
                ) : (
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-display shrink-0 mt-1">
                    Abierto Ahora
                  </span>
                )
              ) : (
                <span className="text-xs font-bold uppercase tracking-wider text-text-muted font-display shrink-0 mt-1">
                  Cerrado Actualmente
                </span>
              )}
            </div>

            {/* Datos Directos en Tipografía Pura (Sin Cajas Anidadas) */}
            <div className="space-y-5 text-text-strong">
              {/* Dirección */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1">
                  Dirección Exacta
                </span>
                <p className="font-bold text-text-strong leading-snug text-base">
                  {activeBranch.address}
                </p>
                <p className="text-xs text-text-muted mt-1">
                  Sector {branchDisplayName} • A 2 cuadras de la Av. Maldonado (Quito Sur)
                </p>
              </div>

              {/* Horario y Contacto */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1">
                    Horario de Atención
                  </span>
                  <p className="font-bold text-text-strong font-mono text-sm">
                    {activeBranch.openingTime} - {activeBranch.closingTime}
                  </p>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    {opStatus.isOpen ? "Lunes a domingo • En servicio" : opStatus.detailLabel}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1">
                    Atención Directa
                  </span>
                  {activeBranch.phone ? (
                    <a
                      href={`tel:${activeBranch.phone}`}
                      className="font-bold text-text-strong font-mono text-sm hover:text-brand-primary transition-colors block"
                    >
                      {activeBranch.phone}
                    </a>
                  ) : (
                    <p className="font-bold text-text-strong text-sm">
                      En Local y en Línea
                    </p>
                  )}
                  <p className="text-[11px] text-text-muted mt-0.5">
                    {opStatus.isOpen ? "Línea activa" : "Recepción diferida"}
                  </p>
                </div>
              </div>

              {/* Modalidades en Lista Limpia Tipográfica (Sin apariencia de botón) */}
              <div className="pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1.5">
                  Modalidades de Atención
                </span>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-semibold text-text-strong">
                  {tenant?.enableDineIn !== false && (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0" />
                      Consumo en Salón
                    </span>
                  )}
                  {tenant?.enableTakeout !== false && (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0" />
                      Para Llevar
                    </span>
                  )}
                  {tenant?.enableDelivery !== false && (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0" />
                      A Domicilio
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Botones de Acción Canónicos (rounded-full) */}
          <div className="pt-6 mt-6 border-t border-surface-border flex flex-col sm:flex-row items-center gap-3">
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
              className="w-full sm:w-auto inline-flex items-center justify-center bg-surface-canvas hover:bg-surface-card-hover border border-surface-border text-text-strong text-xs font-bold font-display uppercase tracking-wider px-6 py-3.5 rounded-full transition-all active:scale-95 text-center"
            >
              {opStatus.isOpen ? "Ver Menú & Ordenar" : "Ver Menú"}
            </a>
          </div>
        </div>

        {/* Columna Derecha: Vista Cartográfica Interactiva Vectorial con MapLibre GL JS */}
        <div className="lg:col-span-7 rounded-3xl border border-surface-border overflow-hidden bg-surface-canvas relative min-h-[380px] lg:min-h-[460px] shadow-xs flex flex-col">
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
