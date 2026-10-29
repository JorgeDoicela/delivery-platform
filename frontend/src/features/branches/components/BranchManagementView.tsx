"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/shared/lib/api-client";
import type { BranchCapacityResponse } from "@/shared/types/api";
import {
  Building2,
  MapPin,
  Clock,
  Layers,
  Phone,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

interface BranchInfo {
  id: number;
  name: string;
  address: string;
  phone: string;
  maxOrdersPerSlot: number;
  geofenceCenter: { lat: number; lng: number };
  zoneName: string;
}

const STATIC_BRANCHES: BranchInfo[] = [
  {
    id: 1,
    name: "Sucursal #1 (Norte)",
    address: "Av. Amazonas y República (Edif. Sky)",
    phone: "0987654321",
    maxOrdersPerSlot: 15,
    geofenceCenter: { lat: -0.1782, lng: -78.4845 },
    zoneName: "Sector Financiero & La Carolina",
  },
  {
    id: 2,
    name: "Sucursal #2 (Sur)",
    address: "Av. Rodrigo de Chávez y Maldonado",
    phone: "0987654322",
    maxOrdersPerSlot: 15,
    geofenceCenter: { lat: -0.23, lng: -78.518 },
    zoneName: "Sector Villa Flora & Centro Sur",
  },
];

export function BranchManagementView() {
  const [capacities, setCapacities] = useState<Record<number, BranchCapacityResponse | null>>({
    1: null,
    2: null,
  });
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchCapacities = async () => {
    const results: Record<number, BranchCapacityResponse | null> = {};

    for (const b of STATIC_BRANCHES) {
      try {
        const cap = await apiClient.getBranchCapacity(b.id);
        results[b.id] = cap;
      } catch {
        results[b.id] = null;
      }
    }

    setCapacities(results);
    setLastRefreshed(new Date());
    setLoading(false);
  };

  const handleManualRefresh = async () => {
    setLoading(true);
    await fetchCapacities();
  };

  useEffect(() => {
    let isSubscribed = true;

    const loadInitial = async () => {
      const results: Record<number, BranchCapacityResponse | null> = {};

      for (const b of STATIC_BRANCHES) {
        try {
          const cap = await apiClient.getBranchCapacity(b.id);
          results[b.id] = cap;
        } catch {
          results[b.id] = null;
        }
      }

      if (isSubscribed) {
        setCapacities(results);
        setLastRefreshed(new Date());
        setLoading(false);
      }
    };

    void loadInitial();
    const interval = setInterval(() => {
      void loadInitial();
    }, 30000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="space-y-6 w-full">
      {/* Cabecera de Administración de Sucursales */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-surface-dark-border gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-primary flex items-center justify-center text-white">
              <Building2 className="w-4 h-4" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wide text-text-inverse-strong font-display">
              Sucursales y Capacidad de Horno
            </h1>
          </div>
          <p className="text-xs text-text-inverse-muted mt-1 leading-relaxed">
            Supervisión de cobertura PostGIS y capacidad por ranuras de 20 min en Redis.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] text-text-inverse-muted font-mono uppercase tracking-wider">
            Actualizado: {lastRefreshed ? lastRefreshed.toLocaleTimeString() : "Consultando..."}
          </span>
          <button
            onClick={handleManualRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-surface-dark-card hover:bg-surface-dark-hover border border-surface-dark-border rounded-full text-xs font-bold uppercase tracking-wider text-text-inverse-strong transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-brand-primary" : ""}`} />
            <span>Refrescar</span>
          </button>
        </div>
      </div>

      {/* Grid de Sucursales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {STATIC_BRANCHES.map((branch) => {
          const cap = capacities[branch.id];

          return (
            <div
              key={branch.id}
              className="bg-surface-dark-card border border-surface-dark-border rounded-3xl p-6 sm:p-7 space-y-5 shadow-xl flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Cabecera de Tarjeta */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-200 bg-neutral-800 border border-neutral-700 px-2.5 py-0.5 rounded-full">
                      ID Sucursal #{branch.id}
                    </span>
                    <h3 className="text-xl font-black uppercase tracking-tight text-text-inverse-strong font-display mt-2">{branch.name}</h3>
                    <p className="text-xs text-text-inverse-muted mt-0.5">{branch.zoneName}</p>
                  </div>
                </div>

                {/* Datos de Contacto y Ubicación */}
                <div className="space-y-2 text-xs text-text-inverse-base bg-surface-dark/60 border border-surface-dark-border/80 rounded-2xl p-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
                    <span>{branch.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-text-inverse-muted shrink-0" />
                    <span className="font-mono">{branch.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px] text-text-inverse-subtle pt-1 border-t border-surface-dark-border">
                    <Layers className="w-3.5 h-3.5" />
                    <span>
                      Geo Centro: {branch.geofenceCenter.lat}, {branch.geofenceCenter.lng}
                    </span>
                  </div>
                </div>

                {/* Métricas de Capacidad en Redis */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-inverse-muted font-medium">Carga en Horno (Ranura 20 min):</span>
                    <span className="font-mono font-bold text-text-inverse-strong">
                      {cap ? `${cap.currentSlotOrders} / ${cap.maxOrdersPerSlot} órdenes` : "Consultando..."}
                    </span>
                  </div>

                  {/* Barra de Progreso de Capacidad */}
                  <div className="w-full bg-surface-dark rounded-full h-2.5 overflow-hidden border border-surface-dark-border">
                    <div
                      className={`h-full transition-all duration-500 ${
                        cap?.isSaturated
                          ? "bg-status-danger"
                          : cap?.isHighDemand
                          ? "bg-status-warning"
                          : "bg-status-success"
                      }`}
                      style={{
                        width: cap
                          ? `${Math.min(100, (cap.currentSlotOrders / cap.maxOrdersPerSlot) * 100)}%`
                          : "0%",
                      }}
                    />
                  </div>

                  {/* Aviso de Demanda */}
                  {cap && (
                    <div
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                        cap.isSaturated
                          ? "bg-status-danger/20 border-status-danger/40 text-status-danger"
                          : cap.isHighDemand
                          ? "bg-status-warning/20 border-status-warning/40 text-status-warning"
                          : "bg-surface-dark border-surface-dark-border text-text-inverse-base"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {cap.isSaturated || cap.isHighDemand ? (
                          <AlertTriangle className="w-4 h-4 text-brand-accent shrink-0" />
                        ) : (
                          <Clock className="w-4 h-4 text-status-success shrink-0" />
                        )}
                        <span>{cap.demandNotice || "Ritmo de despacho normal"}</span>
                      </div>
                      <span className="font-mono font-extrabold text-[11px] px-2 py-0.5 rounded bg-surface-dark-hover text-text-inverse-strong shrink-0">
                        {cap.estimatedDeliveryTime}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Pie de Tarjeta */}
              <div className="pt-3 border-t border-surface-dark-border text-[11px] text-text-inverse-subtle flex justify-between items-center">
                <span>Geocerca PostGIS NetTopologySuite</span>
                <span className="text-brand-accent font-semibold">Ventana: 20 min</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
