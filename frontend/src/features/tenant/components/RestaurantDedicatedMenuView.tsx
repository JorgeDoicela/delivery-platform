"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Bike, MapPin } from "lucide-react";
import { useCurrentTenantQuery } from "../hooks/useTenantQueries";
import { useTenantStore } from "../store/useTenantStore";
import { CatalogSection } from "@/features/catalog";
import { getBranchOperatingStatus } from "@/shared/lib/schedule";

interface RestaurantDedicatedMenuViewProps {
  initialSlug: string;
}

export function RestaurantDedicatedMenuView({
  initialSlug,
}: RestaurantDedicatedMenuViewProps) {
  const setTenantSlug = useTenantStore((s) => s.setTenantSlug);
  const currentSlug = useTenantStore((s) => s.tenantSlug);

  useEffect(() => {
    if (initialSlug && initialSlug !== currentSlug) {
      setTenantSlug(initialSlug);
    }
  }, [initialSlug, currentSlug, setTenantSlug]);

  const { data: tenant } = useCurrentTenantQuery(initialSlug);
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const activeBranch = tenant?.branches?.[0];
  const opStatus = activeBranch
    ? getBranchOperatingStatus(
        activeBranch.openingTime,
        activeBranch.closingTime,
        currentTime
      )
    : { isOpen: true, isClosingSoon: false, detailLabel: "En servicio", badgeLabel: "Abierto" };

  const brandName = tenant?.name || "Restaurante";
  const brandTagline = tenant?.tagline || "Especialidades de la Casa";
  const brandLogo = tenant?.logoUrl || "/images/shared/placeholders/logo-default.png";
  const baseDeliveryFee = tenant?.baseDeliveryFee ?? 1.5;

  return (
    <div className="w-full min-h-screen pb-16 bg-surface-canvas text-text-strong">
      {/* Header Compacto Editorial Dedicado al Menú */}
      <div className="bg-surface-card border-b border-surface-border">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-8 lg:px-12 py-6 space-y-6">
          {/* Navegación Retorno */}
          <div className="flex items-center justify-between">
            <Link
              href={`/${initialSlug}`}
              className="inline-flex items-center gap-2 text-xs font-bold text-text-muted hover:text-text-strong transition-colors uppercase tracking-wider group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span>Volver a la portada de {brandName}</span>
            </Link>

            <span className="text-[11px] font-mono text-text-muted font-bold">
              Carta Digital Oficial
            </span>
          </div>

          {/* Ficha Identitaria del Restaurante */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-2">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-surface-canvas border border-surface-border overflow-hidden p-2 shadow-xs shrink-0">
                <Image
                  src={brandLogo}
                  alt={brandName}
                  width={80}
                  height={80}
                  className="w-full h-full object-contain"
                  priority
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight text-text-strong font-display">
                    {brandName}
                  </h1>
                </div>

                <p className="text-xs sm:text-sm text-text-muted font-medium">
                  {brandTagline} • {tenant?.heroSubtitle || "Menú en línea recién preparado"}
                </p>

                {/* Métricas y Datos Operativos Rápidos */}
                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                  {/* Estado Operativo */}
                  <span
                    className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] font-display ${
                      opStatus.isOpen
                        ? opStatus.isClosingSoon
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-emerald-600 dark:text-emerald-400"
                        : "text-text-muted"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        opStatus.isOpen
                          ? opStatus.isClosingSoon
                            ? "bg-amber-500 animate-pulse"
                            : "bg-emerald-500 animate-pulse"
                          : "bg-neutral-400"
                      }`}
                    />
                    <span>
                      {opStatus.isOpen
                        ? `Abierto hasta ${activeBranch?.closingTime || "21:30"}`
                        : "Cerrado actualmente"}
                    </span>
                  </span>

                  <span className="text-surface-border">•</span>

                  {/* Envío Base */}
                  <span className="inline-flex items-center gap-1 text-text-muted font-medium">
                    <Bike className="w-3.5 h-3.5 text-brand-primary" />
                    <span>Envío: ${baseDeliveryFee.toFixed(2)}</span>
                  </span>

                  {activeBranch && (
                    <>
                      <span className="text-surface-border">•</span>
                      <span className="inline-flex items-center gap-1 text-text-muted font-medium truncate max-w-[200px] sm:max-w-none">
                        <MapPin className="w-3.5 h-3.5 text-text-muted" />
                        <span>{activeBranch.name}</span>
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenedor del Catálogo Completo */}
      <main className="max-w-[1240px] mx-auto px-4 sm:px-8 lg:px-12 pt-8">
        <CatalogSection tenantSlug={initialSlug} />
      </main>
    </div>
  );
}