"use client";

import { useState } from "react";
import { apiClient } from "@/shared/lib/api-client";
import { useCartStore } from "@/features/cart";
import type { BranchCoverageDto, BranchCapacityResponse } from "@/shared/types/api";
import { MapPin, Navigation, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { AddressSelector } from "./AddressSelector";

interface GeofenceCheckerProps {
  onLocationResolved: (lat: number, lng: number) => void;
}

export function GeofenceChecker({ onLocationResolved }: GeofenceCheckerProps) {
  const setBranch = useCartStore((s) => s.setBranch);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvedBranch, setResolvedBranch] = useState<BranchCoverageDto | null>(null);
  const [capacity, setCapacity] = useState<BranchCapacityResponse | null>(null);
  const [showMap, setShowMap] = useState(false);

  const testLocation = async (lat: number, lng: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const branch = await apiClient.resolveBranch(lat, lng);
      setResolvedBranch(branch);
      setBranch(branch.branchId, branch.branchName);
      onLocationResolved(lat, lng);

      try {
        const cap = await apiClient.getBranchCapacity(branch.branchId);
        setCapacity(cap);
      } catch {
        // Tolerancia a desconexión volátil de Redis
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "La ubicación seleccionada está fuera de nuestra zona de cobertura. Por favor selecciona otra zona o elige Retiro en Local.";
      setError(errorMessage);
      setResolvedBranch(null);
      setCapacity(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("La geolocalización no está soportada en tu navegador.");
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        testLocation(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setIsLoading(false);
        setError("No pudimos obtener tu ubicación GPS. Selecciona una zona predefinida para probar.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Validación de Cobertura</h3>
            <p className="text-[11px] text-slate-500">
              Verificamos con PostGIS la sucursal más cercana para tu entrega
            </p>
          </div>
        </div>
      </div>

      {/* Botón GPS, Mapa y Zonas Predefinidas */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all active:scale-95"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
            ) : (
              <Navigation className="w-4 h-4 text-orange-400" />
            )}
            <span>Detectar mi GPS</span>
          </button>

          <button
            type="button"
            onClick={() => setShowMap(!showMap)}
            className={`flex items-center justify-center gap-2 text-xs font-bold py-2.5 px-4 rounded-xl border transition-all active:scale-95 ${
              showMap
                ? 'bg-orange-50 border-orange-300 text-orange-700'
                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <MapPin className="w-4 h-4 text-orange-500" />
            <span>{showMap ? 'Ocultar Mapa' : 'Seleccionar en Mapa'}</span>
          </button>
        </div>

        {/* Mapa Interactivo con MapLibre */}
        {showMap && (
          <div className="pt-2 animate-in fade-in duration-300">
            <AddressSelector onLocationSelect={(lat, lng) => testLocation(lat, lng)} />
          </div>
        )}

        <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
          <span>O prueba una zona:</span>
          <button
            type="button"
            onClick={() => testLocation(-0.1782, -78.4845)}
            className="font-bold text-orange-600 hover:underline"
          >
            Quito Norte (Sucursal 1)
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => testLocation(-0.2300, -78.5180)}
            className="font-bold text-orange-600 hover:underline"
          >
            Quito Sur (Sucursal 2)
          </button>
        </div>
      </div>

      {/* Resultado Exitoso */}
      {resolvedBranch && (
        <div className="space-y-2">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-emerald-900 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">{resolvedBranch.branchName} asignada</p>
              <p className="text-emerald-700 text-[11px] mt-0.5">{resolvedBranch.address}</p>
            </div>
          </div>

          {capacity && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 animate-in fade-in ${
                capacity.isSaturated
                  ? "bg-red-50 border-red-200 text-red-950"
                  : capacity.isHighDemand
                  ? "bg-amber-50 border-amber-200 text-amber-950"
                  : "bg-slate-50 border-slate-200 text-slate-800"
              }`}
            >
              <div>
                <p className="font-bold">
                  {capacity.isSaturated
                    ? "Capacidad de horno al límite"
                    : capacity.isHighDemand
                    ? "Alta demanda en cocina"
                    : "Tiempo de entrega estimado"}
                </p>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  {capacity.demandNotice || "Preparación y despacho en ritmo estándar"}
                </p>
              </div>
              <span className="font-mono font-extrabold text-xs px-2.5 py-1 rounded bg-white border border-slate-200 shadow-sm shrink-0">
                {capacity.estimatedDeliveryTime}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Alerta Fuera de Cobertura */}
      {error && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-orange-950 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Fuera de Cobertura de Despacho</p>
            <p className="text-orange-800 text-[11px] mt-0.5 leading-relaxed">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
