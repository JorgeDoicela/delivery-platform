"use client";

import React, { useState } from "react";
import {
  MapPin,
  Phone,
  Clock,
  Navigation,
  UtensilsCrossed,
  ShoppingBag,
  Bike,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
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

  // Coordenadas con fallback a Guamaní
  const lat = activeBranch.latitude || -0.33228;
  const lng = activeBranch.longitude || -78.557082;

  // Enlace directo a Google Maps
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  const shortLinkUrl = "https://maps.app.goo.gl/bitq9r465t2GuHKCA";

  // Bounding box para OpenStreetMap con zoom más cercano y nítido
  const bbox = `${lng - 0.007}%2C${lat - 0.0045}%2C${lng + 0.007}%2C${lat + 0.0045}`;
  const embedMapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;

  return (
    <section id="sucursales" className="max-w-[1240px] mx-auto pt-10 w-full space-y-6">
      {/* Encabezado Claro y Humano */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-4 border-b border-surface-border gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-brand-primary block mb-1">
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
          <div className="flex items-center gap-2 bg-neutral-100 p-1 rounded-2xl border border-neutral-200 shrink-0">
            {branches.map((b) => {
              const isSelected = b.id === activeBranch.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelectedBranchId(b.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-display uppercase tracking-wider transition-all ${
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
        {/* Columna Izquierda: Información de Atención (5 columnas) */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-white border border-neutral-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="space-y-5">
            {/* Cabecera del Local y Estatus en Vivo */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 block mb-1">
                  Restaurante Matriz
                </span>
                <h4 className="text-2xl font-black text-neutral-900 uppercase tracking-wide font-display">
                  {activeBranch.name}
                </h4>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900 text-white text-[11px] font-mono font-bold tracking-wider shrink-0 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>ABIERTO AHORA</span>
              </div>
            </div>

            {/* Dirección Humana y Referencia */}
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/70 space-y-1.5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
                    Dirección Exacta
                  </span>
                  <p className="text-sm font-bold text-neutral-900 leading-snug">
                    {activeBranch.address}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Sector Guamaní • A 2 cuadras de la Av. Maldonado (Quito Sur)
                  </p>
                </div>
              </div>
            </div>

            {/* Horarios y Teléfono */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/70 space-y-1">
                <div className="flex items-center gap-2 text-neutral-500 text-[10px] font-bold uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5 text-neutral-700" />
                  <span>Horario de Atención</span>
                </div>
                <p className="text-xs font-bold text-neutral-900 font-mono">
                  {activeBranch.openingTime} a {activeBranch.closingTime}
                </p>
                <p className="text-[10px] text-neutral-500">De lunes a domingo</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/70 space-y-1">
                <div className="flex items-center gap-2 text-neutral-500 text-[10px] font-bold uppercase tracking-wider">
                  <Phone className="w-3.5 h-3.5 text-neutral-700" />
                  <span>Pedidos por Teléfono</span>
                </div>
                <a
                  href={`tel:${activeBranch.phone}`}
                  className="text-xs font-bold text-neutral-900 font-mono hover:text-brand-primary block"
                >
                  {activeBranch.phone}
                </a>
                <p className="text-[10px] text-neutral-500">Llamada directa</p>
              </div>
            </div>

            {/* Servicios y Formas de Pedir */}
            <div className="space-y-2 pt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                Cómo Puedes Disfrutarlo
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center justify-center p-3 rounded-2xl border border-neutral-200 bg-white text-center shadow-2xs">
                  <UtensilsCrossed className="w-4 h-4 text-brand-primary mb-1.5" />
                  <span className="text-[11px] font-bold uppercase font-display text-neutral-900">
                    En el Local
                  </span>
                  <span className="text-[10px] text-neutral-500">Mesas y atención</span>
                </div>

                <div className="flex flex-col items-center justify-center p-3 rounded-2xl border border-neutral-200 bg-white text-center shadow-2xs">
                  <ShoppingBag className="w-4 h-4 text-brand-primary mb-1.5" />
                  <span className="text-[11px] font-bold uppercase font-display text-neutral-900">
                    Para Llevar
                  </span>
                  <span className="text-[10px] text-neutral-500">Retiro rápido</span>
                </div>

                <div className="flex flex-col items-center justify-center p-3 rounded-2xl border border-neutral-200 bg-white text-center shadow-2xs">
                  <Bike className="w-4 h-4 text-brand-primary mb-1.5" />
                  <span className="text-[11px] font-bold uppercase font-display text-neutral-900">
                    A Domicilio
                  </span>
                  <span className="text-[10px] text-neutral-500">Directo a tu puerta</span>
                </div>
              </div>
            </div>
          </div>

          {/* Botones de Acción Amigables */}
          <div className="pt-4 border-t border-neutral-100 flex flex-col sm:flex-row items-center gap-3">
            <a
              href={shortLinkUrl || googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold font-display uppercase tracking-wider px-5 py-3 rounded-2xl shadow-xs transition-all active:scale-95"
            >
              <Navigation className="w-4 h-4 text-white" />
              <span>Cómo Llegar en Maps</span>
              <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
            </a>

            <a
              href="#catalogo"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold font-display uppercase tracking-wider px-5 py-3 rounded-2xl shadow-xs transition-all active:scale-95"
            >
              <span>Ver Menú y Pedir</span>
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </a>
          </div>
        </div>

        {/* Columna Derecha: Mapa Interactivo Limpio */}
        <div className="lg:col-span-7 rounded-3xl border border-neutral-200/90 overflow-hidden bg-neutral-100 relative min-h-[380px] lg:min-h-[460px] shadow-xs flex flex-col">
          {/* Iframe con mapa vectorial OpenStreetMap con recorte del pie de página técnico */}
          <div className="w-full h-full min-h-[380px] lg:min-h-[460px] overflow-hidden relative">
            <iframe
              title={`Ubicación de ${activeBranch.name}`}
              src={embedMapUrl}
              className="w-full border-0 absolute top-0 left-0 right-0"
              style={{ height: "calc(100% + 28px)" }}
              loading="lazy"
            />
          </div>

          {/* Tarjeta Flotante Superior en el Mapa */}
          <div className="absolute top-4 left-4 right-4 sm:right-auto bg-white/95 backdrop-blur-md border border-neutral-200/90 rounded-2xl px-4 py-2.5 shadow-md flex items-center justify-between sm:justify-start gap-3 pointer-events-none">
            <div className="w-3 h-3 rounded-full bg-brand-primary animate-ping shrink-0" />
            <div>
              <span className="font-display font-black text-xs uppercase tracking-wide text-neutral-900 block leading-tight">
                {tenant?.name || "La Granjita"} • {activeBranch.name}
              </span>
              <span className="text-[11px] text-neutral-600 block leading-tight">
                {activeBranch.address}
              </span>
            </div>
          </div>

          {/* Botón Flotante Inferior de Navegación Directa */}
          <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md border border-neutral-200 rounded-2xl p-1.5 shadow-md">
            <a
              href={shortLinkUrl || googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-[11px] font-bold font-display uppercase tracking-wider transition-all shadow-xs"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Abrir en Google Maps</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
