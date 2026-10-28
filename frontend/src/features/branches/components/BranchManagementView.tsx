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
  ShieldCheck,
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
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Cabecera de Administración de Sucursales */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-orange-500" />
            <h1 className="text-xl font-black text-white tracking-tight">
              Sucursales y Capacidad de Horno
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Supervisión de cobertura PostGIS y capacidad por ranuras de 20 min en Redis.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-400 font-mono">
            Actualizado: {lastRefreshed ? lastRefreshed.toLocaleTimeString() : "Consultando..."}
          </span>
          <button
            onClick={handleManualRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-orange-400" : ""}`} />
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
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Cabecera de Tarjeta */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 bg-orange-950/60 border border-orange-800/60 px-2 py-0.5 rounded">
                      ID Sucursal #{branch.id}
                    </span>
                    <h3 className="text-lg font-black text-white mt-1.5">{branch.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{branch.zoneName}</p>
                  </div>

                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Operativa
                  </span>
                </div>

                {/* Datos de Contacto y Ubicación */}
                <div className="space-y-2 text-xs text-slate-300 bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                    <span>{branch.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-mono">{branch.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500 pt-1 border-t border-slate-800">
                    <Layers className="w-3.5 h-3.5" />
                    <span>
                      Geo Centro: {branch.geofenceCenter.lat}, {branch.geofenceCenter.lng}
                    </span>
                  </div>
                </div>

                {/* Métricas de Capacidad en Redis */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Carga en Horno (Ranura 20 min):</span>
                    <span className="font-mono font-bold text-white">
                      {cap ? `${cap.currentSlotOrders} / ${cap.maxOrdersPerSlot} órdenes` : "Consultando..."}
                    </span>
                  </div>

                  {/* Barra de Progreso de Capacidad */}
                  <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-500 ${
                        cap?.isSaturated
                          ? "bg-red-500"
                          : cap?.isHighDemand
                          ? "bg-amber-500"
                          : "bg-emerald-500"
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
                          ? "bg-red-950/40 border-red-800 text-red-300"
                          : cap.isHighDemand
                          ? "bg-amber-950/40 border-amber-800 text-amber-300"
                          : "bg-slate-950 border-slate-800 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {cap.isSaturated || cap.isHighDemand ? (
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        ) : (
                          <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                        <span>{cap.demandNotice || "Ritmo de despacho normal"}</span>
                      </div>
                      <span className="font-mono font-extrabold text-[11px] px-2 py-0.5 rounded bg-slate-800 text-white shrink-0">
                        {cap.estimatedDeliveryTime}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Pie de Tarjeta */}
              <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex justify-between items-center">
                <span>Geocerca PostGIS NetTopologySuite</span>
                <span className="text-orange-400 font-semibold">Ventana: 20 min</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
