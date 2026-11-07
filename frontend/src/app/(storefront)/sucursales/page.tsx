"use client";

import React, { Suspense } from "react";
import { MapPin, Phone, Clock, Loader2 } from "lucide-react";
import Link from "next/link";
import { useCartStore } from "@/features/cart";
import { useBranchesQuery, useCurrentTenantQuery } from "@/features/tenant";
import { getBranchOperatingStatus } from "@/shared/lib/schedule";
import { useTenantRoutes } from "@/shared/lib/tenant-routing";

function SucursalesContent() {
  const { data: tenant } = useCurrentTenantQuery();
  const routes = useTenantRoutes(tenant?.slug);
  const { data: branches, isLoading } = useBranchesQuery();
  const setBranch = useCartStore((s) => s.setBranch);

  const activeBranches = branches ?? tenant?.branches ?? [];

  return (
    <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-8 lg:px-12 py-8 space-y-8">
      <div className="border-b border-surface-border pb-4">
        <h1 className="text-3xl sm:text-4xl font-black text-text-strong uppercase tracking-wide font-display">
          Sucursales de {tenant?.name || "Nuestro Negocio"}
        </h1>
        <p className="text-xs sm:text-sm text-text-muted mt-1 leading-relaxed">
          Puntos de atención, cobertura directa a domicilio y horarios de servicio en tiempo real
        </p>
      </div>

      {isLoading && activeBranches.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-64 rounded-3xl bg-neutral-100 animate-pulse border border-neutral-200"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {activeBranches.map((branch, idx) => {
            const opStatus = getBranchOperatingStatus(branch.openingTime, branch.closingTime);

            return (
              <div
                key={branch.id}
                className="bg-surface-card border border-surface-border rounded-3xl p-5 sm:p-8 space-y-5 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-text-strong bg-surface-canvas border border-surface-border px-2.5 py-0.5 rounded-full font-mono">
                        Sucursal #{idx + 1}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full font-mono ${
                          !branch.isActive
                            ? "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                            : opStatus.isOpen
                            ? "bg-status-success/20 text-status-success border border-status-success/40"
                            : "bg-surface-canvas text-text-muted border border-surface-border"
                        }`}
                      >
                        {!branch.isActive ? "Pausada" : opStatus.statusLabel}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-text-strong font-display mt-2 truncate">
                      {branch.name}
                    </h2>
                    <p className="text-xs text-text-muted mt-0.5">
                      Capacidad máxima: {branch.maxOrdersPerSlot} órdenes por ventana de 20 min
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-text-base bg-surface-canvas border border-surface-border rounded-2xl p-4">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
                    <span>{branch.address}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-text-muted shrink-0" />
                    <span className="font-mono">{branch.phone}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-brand-primary shrink-0" />
                    <span>
                      Horario: <strong className="font-mono">{branch.openingTime} - {branch.closingTime}</strong> ({opStatus.detailLabel})
                    </span>
                  </div>
                </div>

                <Link
                  href={routes.getCatalogHref(branch.id)}
                  onClick={() => setBranch(branch.id, branch.name)}
                  className="inline-flex items-center justify-center w-full bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold uppercase tracking-wider py-3.5 px-6 rounded-full shadow-md transition-all active:scale-95 min-h-[44px]"
                >
                  {opStatus.isOpen ? "Ordenar en esta sucursal" : "Ver Menú de esta sucursal"}
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function SucursalesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-text-muted gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Cargando sucursales...
          </span>
        </div>
      }
    >
      <SucursalesContent />
    </Suspense>
  );
}
