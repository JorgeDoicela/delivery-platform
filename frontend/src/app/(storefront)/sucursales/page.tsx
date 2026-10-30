"use client";

import React from "react";
import { MapPin, Phone, Clock } from "lucide-react";
import Link from "next/link";
import { useCartStore } from "@/features/cart";
import { useBranchesQuery, useCurrentTenantQuery } from "@/features/tenant";

export default function SucursalesPage() {
  const { data: tenant } = useCurrentTenantQuery();
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
          Puntos de atención, geocercas PostGIS activas y horarios de cobertura en tiempo real
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
          {activeBranches.map((branch, idx) => (
            <div
              key={branch.id}
              className="bg-surface-card border border-surface-border rounded-3xl p-6 sm:p-8 space-y-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-800 bg-neutral-100 border border-neutral-200 px-2.5 py-0.5 rounded-full">
                    Sucursal #{idx + 1} (ID: {branch.id})
                  </span>
                  <h2 className="text-2xl font-black uppercase tracking-tight text-text-strong font-display mt-2">
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
                    Lunes a Domingo: {branch.openingTime} - {branch.closingTime}
                  </span>
                </div>
              </div>

              <Link
                href="/finalizar-pedido"
                onClick={() => setBranch(branch.id, branch.name)}
                className="inline-flex items-center justify-center w-full bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold uppercase tracking-wider py-3.5 px-6 rounded-full shadow-md transition-all active:scale-95"
              >
                Ordenar en esta sucursal
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
