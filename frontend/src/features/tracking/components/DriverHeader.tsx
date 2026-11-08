'use client';

import { useState } from 'react';
import { Bike, Car, CheckCircle2, PauseCircle, DollarSign, Package, Building2 } from 'lucide-react';
import { DriverProfileResponse, DriverShiftSummaryDto } from '@/shared/types/api';
import { useBranchesQuery, useCurrentTenantQuery } from '@/features/tenant';
import { useDriverStore } from '../store/useDriverStore';
import type { DriverConnectionStatus } from '../hooks/useDriverHub';

interface DriverHeaderProps {
  profile: DriverProfileResponse | null;
  shiftSummary: DriverShiftSummaryDto;
  onToggleAvailability: (isAvailable: boolean) => Promise<boolean>;
  connectionStatus?: DriverConnectionStatus;
}

export function DriverHeader({
  profile,
  shiftSummary,
  onToggleAvailability,
  connectionStatus = 'connected',
}: DriverHeaderProps) {
  const [isToggling, setIsToggling] = useState(false);
  const isAvailable = profile?.isAvailable ?? true;

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      await onToggleAvailability(!isAvailable);
    } finally {
      setIsToggling(false);
    }
  };

  const isMotorcycle = profile?.vehicleType?.toLowerCase().includes('moto') ?? true;

  const { data: branchesData } = useBranchesQuery();
  const { data: tenantData } = useCurrentTenantQuery();
  const branches = branchesData ?? tenantData?.branches ?? [];
  const selectedBranchId = useDriverStore((s) => s.selectedBranchId);
  const setSelectedBranchId = useDriverStore((s) => s.setSelectedBranchId);

  return (
    <div className="bg-surface-card border border-surface-border rounded-3xl p-4 sm:p-5 shadow-xs transition-colors duration-200 space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Identidad del Repartidor */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-surface-canvas border border-surface-border flex items-center justify-center text-brand-primary shrink-0">
            {isMotorcycle ? <Bike className="w-6 h-6" /> : <Car className="w-6 h-6" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-display font-black text-lg sm:text-xl uppercase tracking-tight text-text-strong truncate">
                {profile?.fullName || 'Repartidor'}
              </h1>
              {profile?.licensePlate && (
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-surface-canvas border border-surface-border text-text-muted shrink-0">
                  {profile.licensePlate}
                </span>
              )}
            </div>

            {branches.length > 1 ? (
              <div className="flex items-center gap-1.5 mt-1">
                <Building2 className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                <select
                  value={selectedBranchId ?? ""}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : null;
                    setSelectedBranchId(val);
                  }}
                  aria-label="Filtrar pedidos por sucursal"
                  className="bg-surface-canvas border border-surface-border text-text-strong rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider focus:outline-none cursor-pointer max-w-[160px] sm:max-w-[200px] truncate"
                >
                  <option value="">Todas las sucursales</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <span className="text-text-muted text-[10px]">•</span>
                <span className="text-[11px] text-text-muted font-mono">{profile?.vehicleType || 'MOTO'}</span>
              </div>
            ) : (
              <p className="text-xs text-text-muted truncate mt-0.5">
                {profile?.branchName || 'Todas las sucursales'} • {profile?.vehicleType || 'Motocicleta'}
              </p>
            )}
          </div>
        </div>

        {/* Acciones y Estado de Disponibilidad */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          {connectionStatus === 'connected' ? (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-status-success/15 border border-status-success/30 text-status-success text-[11px] font-bold uppercase tracking-wider font-mono select-none shadow-xs"
              title="Sincronización en tiempo real activa vía WebSockets"
            >
              <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
              <span>En Vivo</span>
            </div>
          ) : connectionStatus === 'reconnecting' ? (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-status-warning/15 border border-status-warning/30 text-status-warning text-[11px] font-bold uppercase tracking-wider font-mono select-none shadow-xs"
              title="Reconectando con el servidor..."
            >
              <span className="w-2 h-2 rounded-full bg-status-warning animate-ping" />
              <span>Reconectando</span>
            </div>
          ) : (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-canvas border border-surface-border text-text-muted text-[11px] font-bold uppercase tracking-wider font-mono select-none shadow-xs"
              title="Sincronización automática activa"
            >
              <span className="w-2 h-2 rounded-full bg-neutral-400" />
              <span>En Línea</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleToggle}
            disabled={isToggling}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
              isAvailable
                ? 'bg-status-success/15 text-status-success border-status-success/40 hover:bg-status-success/25'
                : 'bg-status-warning/15 text-status-warning border-status-warning/40 hover:bg-status-warning/25'
            }`}
          >
            {isAvailable ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Disponible</span>
              </>
            ) : (
              <>
                <PauseCircle className="w-3.5 h-3.5 shrink-0" />
                <span>En Pausa</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Resumen Rápido de Turno */}
      <div className="grid grid-cols-2 gap-2.5 pt-1 border-t border-surface-border text-xs">
        <div className="flex items-center gap-2 bg-surface-canvas px-3.5 py-2.5 rounded-2xl border border-surface-border">
          <Package className="w-4 h-4 text-brand-primary shrink-0" />
          <div className="min-w-0">
            <span className="text-[10px] text-text-muted block leading-none">Entregados hoy</span>
            <span className="font-mono font-bold text-text-strong text-sm">
              {shiftSummary.completedCount} pedidos
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-surface-canvas px-3.5 py-2.5 rounded-2xl border border-surface-border">
          <DollarSign className="w-4 h-4 text-status-success shrink-0" />
          <div className="min-w-0">
            <span className="text-[10px] text-text-muted block leading-none">Efectivo en mano</span>
            <span className="font-mono font-bold text-status-success text-sm">
              ${shiftSummary.cashCollected.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

