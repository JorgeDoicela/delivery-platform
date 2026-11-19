'use client';

import { useState } from 'react';
import { Bike, Car, CheckCircle2, PauseCircle, DollarSign, Package, Building2 } from 'lucide-react';
import { DriverProfileResponse, DriverShiftSummaryDto } from '@/shared/types/api';
import { Select, type SelectOption } from '@/shared/components/Select';
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

  const branchOptions: SelectOption<string>[] = [
    { value: "", label: "Todas las sucursales" },
    ...branches.map((b) => ({
      value: String(b.id),
      label: b.name,
    })),
  ];

  return (
    <div className="bg-transparent sm:bg-surface-card border-b border-surface-border sm:border sm:border-surface-border rounded-none sm:rounded-3xl pb-3.5 pt-1 sm:p-5 shadow-none sm:shadow-xs transition-colors duration-200 space-y-3">
      <div className="flex items-center justify-between gap-3">
        {/* Identidad del Repartidor */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="text-brand-primary shrink-0">
            {isMotorcycle ? <Bike className="w-7 h-7" /> : <Car className="w-7 h-7" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-display font-black text-lg sm:text-xl uppercase tracking-tight text-text-strong truncate">
                {profile?.fullName || 'Repartidor'}
              </h1>
              {profile?.licensePlate && (
                <span className="font-mono text-xs text-text-muted shrink-0 font-bold">
                  • {profile.licensePlate}
                </span>
              )}
            </div>

            {branches.length > 1 ? (
              <div className="flex items-center gap-1.5 mt-0.5">
                <Select<string>
                  options={branchOptions}
                  value={selectedBranchId ? String(selectedBranchId) : ""}
                  onChange={(val) => {
                    const parsed = val ? Number(val) : null;
                    setSelectedBranchId(parsed);
                  }}
                  size="sm"
                  leftIcon={Building2}
                  className="w-auto min-w-[150px] max-w-[220px]"
                  triggerClassName="!min-h-[30px] !py-0.5 !px-2.5 !rounded-full !text-[11px] font-bold uppercase tracking-wider"
                  aria-label="Filtrar pedidos por sucursal"
                />
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
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={handleToggle}
            disabled={isToggling}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
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
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-surface-border text-xs">
        <div className="flex items-center gap-2.5 py-1">
          <Package className="w-4 h-4 text-brand-primary shrink-0" />
          <div className="min-w-0">
            <span className="text-[10px] text-text-muted block leading-none">Entregados hoy</span>
            <span className="font-mono font-bold text-text-strong text-sm">
              {shiftSummary.completedCount} pedidos
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 py-1">
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

