"use client";

import { useState } from "react";
import { apiClient } from "@/shared/lib/api-client";
import { useCartStore } from "@/features/cart";
import { useCurrentTenantQuery } from "@/features/tenant";
import type { BranchCoverageDto, BranchCapacityResponse } from "@/shared/types/api";
import { MapPin, Navigation, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { AddressSelector } from "./AddressSelector";

interface GeofenceCheckerProps {
  onLocationResolved: (lat: number, lng: number) => void;
}

export function GeofenceChecker({ onLocationResolved }: GeofenceCheckerProps) {
  const setBranch = useCartStore((s) => s.setBranch);
  const { data: tenant } = useCurrentTenantQuery();
  const tenantBranches = tenant?.branches ?? [];

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
    <div className="bg-surface-card rounded-2xl border border-surface-border p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-surface-border-subtle">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-900 flex items-center justify-center">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-text-strong font-display">Validación de Cobertura</h3>
            <p className="text-[11px] text-text-muted">
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
            className="flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 disabled:bg-surface-border text-white text-xs font-bold uppercase tracking-wider py-3 px-5 rounded-full shadow-sm transition-all active:scale-95"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
            ) : (
              <Navigation className="w-4 h-4 text-amber-300" />
            )}
            <span>Detectar mi GPS</span>
          </button>

          <button
            type="button"
            onClick={() => setShowMap(!showMap)}
            className={`flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider py-3 px-5 rounded-full border transition-all active:scale-95 ${
              showMap
                ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                : 'bg-surface-card border-surface-border hover:bg-surface-card-hover text-text-strong'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>{showMap ? 'Ocultar Mapa' : 'Seleccionar en Mapa'}</span>
          </button>
        </div>

        {/* Mapa Interactivo con MapLibre */}
        {showMap && (
          <div className="pt-2 animate-in fade-in duration-300">
            <AddressSelector onLocationSelect={(lat, lng) => testLocation(lat, lng)} />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-text-muted">
          <span>O prueba cobertura en una sucursal de {tenant?.name}:</span>
          {tenantBranches.map((branch, idx) => (
            <span key={branch.id} className="inline-flex items-center gap-2">
              {idx > 0 && <span>•</span>}
              <button
                type="button"
                onClick={() => testLocation(branch.latitude, branch.longitude)}
                className="font-bold text-brand-primary hover:underline"
              >
                {branch.name}
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Resultado Exitoso */}
      {resolvedBranch && (
        <div className="space-y-2">
          <div className="bg-status-success-bg border border-status-success-border rounded-xl p-3 flex items-start gap-2.5 text-xs text-status-success animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-status-success shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">{resolvedBranch.branchName} asignada</p>
              <p className="text-status-success/80 text-[11px] mt-0.5">{resolvedBranch.address}</p>
            </div>
          </div>

          {capacity && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 animate-in fade-in ${
                capacity.isSaturated
                  ? "bg-status-danger-bg border-status-danger-border text-status-danger"
                  : capacity.isHighDemand
                  ? "bg-status-warning-bg border-status-warning-border text-status-warning"
                  : "bg-surface-canvas border-surface-border text-text-strong"
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
                <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">
                  {capacity.demandNotice || "Preparación y despacho en ritmo estándar"}
                </p>
              </div>
              <span className="font-mono font-extrabold text-xs px-2.5 py-1 rounded bg-surface-card border border-surface-border shadow-sm shrink-0">
                {capacity.estimatedDeliveryTime}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Alerta Fuera de Cobertura */}
      {error && (
        <div className="bg-status-warning-bg border border-status-warning-border rounded-xl p-3 flex items-start gap-2.5 text-xs text-status-warning animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-status-warning shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Fuera de Cobertura de Despacho</p>
            <p className="text-status-warning/90 text-[11px] mt-0.5 leading-relaxed">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
