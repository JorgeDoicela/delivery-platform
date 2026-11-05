"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/lib/api-client";
import type { BranchCapacityResponse, BranchDetailDto } from "@/shared/types/api";
import { useCurrentTenantQuery, useBranchesQuery } from "@/features/tenant";
import { getBranchOperatingStatus } from "@/shared/lib/schedule";
import { BranchScheduleEditorModal } from "./BranchScheduleEditorModal";
import {
    Building2,
    MapPin,
    Phone,
    RefreshCw,
    Clock,
    AlertTriangle,
    Layers,
    CalendarClock,
} from "lucide-react";

export function BranchManagementView() {
    const [editingBranch, setEditingBranch] = useState<BranchDetailDto | null>(null);
    const { data: tenant } = useCurrentTenantQuery();
    const { data: branchesData } = useBranchesQuery();
    const branches = useMemo(
        () => branchesData ?? tenant?.branches ?? [],
        [branchesData, tenant?.branches]
    );

    const branchIdsKey = useMemo(
        () => branches.map((b) => b.id).sort((a, b) => a - b).join(","),
        [branches]
    );

    const {
        data: capacitiesData,
        isFetching,
        dataUpdatedAt,
        refetch,
    } = useQuery({
        queryKey: ["branch-capacities", branchIdsKey],
        queryFn: async () => {
            const results: Record<number, BranchCapacityResponse | null> = {};
            for (const b of branches) {
                try {
                    const cap = await apiClient.getBranchCapacity(b.id);
                    results[b.id] = cap;
                } catch {
                    results[b.id] = null;
                }
            }
            return results;
        },
        enabled: branches.length > 0,
        refetchInterval: 30000,
    });

    const capacities = capacitiesData ?? {};

    return (
        <div className="space-y-6 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-surface-border gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-brand-primary flex items-center justify-center text-white">
                            <Building2 className="w-4 h-4" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wide text-text-strong font-display">
                            Sucursales y Capacidad • {tenant?.name}
                        </h1>
                    </div>
                    <p className="text-xs text-text-muted mt-1 leading-relaxed">
                        Supervisión de cobertura PostGIS y capacidad por ranuras de 20 min en Redis.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-[10px] text-text-muted font-mono uppercase tracking-wider">
                        Actualizado: {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : "Consultando..."}
                    </span>
                    <button
                        onClick={() => void refetch()}
                        disabled={isFetching}
                        className="flex items-center gap-1.5 px-4 py-2 bg-surface-card hover:bg-surface-card-hover border border-surface-border rounded-full text-xs font-bold uppercase tracking-wider text-text-strong transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-brand-primary" : ""}`} />
                        <span>Refrescar</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {branches.map((branch) => {
                    const cap = capacities[branch.id];
                    const opStatus = getBranchOperatingStatus(branch.openingTime, branch.closingTime);

                    return (
                        <div
                            key={branch.id}
                            className="bg-surface-card border border-surface-border rounded-3xl p-6 sm:p-7 space-y-5 shadow-xs flex flex-col justify-between transition-colors duration-200"
                        >
                            <div className="space-y-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-text-strong bg-surface-canvas border border-surface-border px-2.5 py-0.5 rounded-full font-mono">
                                                ID #{branch.id}
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
                                        <h3 className="text-xl font-black uppercase tracking-tight text-text-strong font-display mt-2">
                                            {branch.name}
                                        </h3>
                                        <p className="text-xs text-text-muted mt-0.5">
                                            Horario: <strong className="text-text-strong font-mono">{branch.openingTime} - {branch.closingTime}</strong>
                                            {" • "}{opStatus.detailLabel}
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setEditingBranch(branch as BranchDetailDto)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-canvas hover:bg-surface-card-hover border border-surface-border rounded-full text-xs font-bold font-display uppercase tracking-wider text-brand-primary transition-all active:scale-95 cursor-pointer shrink-0"
                                        title="Modificar horario y disponibilidad de la sucursal"
                                    >
                                        <CalendarClock className="w-3.5 h-3.5" />
                                        <span>Editar Horario</span>
                                    </button>
                                </div>

                                <div className="space-y-2 text-xs text-text-base bg-surface-canvas border border-surface-border rounded-2xl p-4">
                                    <div className="flex items-start gap-2">
                                        <MapPin className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
                                        <span>{branch.address}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-text-muted shrink-0" />
                                        <span className="font-mono">{branch.phone}</span>
                                    </div>
                                    <div className="flex items-center gap-2 font-mono text-[11px] text-text-muted pt-1 border-t border-surface-border">
                                        <Layers className="w-3.5 h-3.5" />
                                        <span>
                                            Geo Centro: {branch.latitude.toFixed(4)}, {branch.longitude.toFixed(4)}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-text-muted font-medium">
                                            Carga en Cocina (Ranura 20 min):
                                        </span>
                                        <span className="font-mono font-bold text-text-strong">
                                            {cap
                                                ? `${cap.currentSlotOrders} / ${cap.maxOrdersPerSlot} órdenes`
                                                : `0 / ${branch.maxOrdersPerSlot} órdenes`}
                                        </span>
                                    </div>

                                    <div className="w-full bg-surface-canvas rounded-full h-2.5 overflow-hidden border border-surface-border">
                                        <div
                                            className={`h-full transition-all duration-500 ${cap?.isSaturated
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

                                    {cap && (
                                        <div
                                            className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${cap.isSaturated
                                                    ? "bg-status-danger/20 border-status-danger/40 text-status-danger"
                                                    : cap.isHighDemand
                                                        ? "bg-status-warning/20 border-status-warning/40 text-status-warning"
                                                        : "bg-surface-canvas border-surface-border text-text-base"
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
                                            <span className="font-mono font-extrabold text-[11px] px-2 py-0.5 rounded bg-surface-card border border-surface-border text-text-strong shrink-0">
                                                {cap.estimatedDeliveryTime}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-3 border-t border-surface-border text-[11px] text-text-muted flex justify-between items-center">
                                <span>Geocerca PostGIS NetTopologySuite</span>
                                <span className="text-brand-accent font-semibold">Ventana: 20 min</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <BranchScheduleEditorModal
                branch={editingBranch}
                isOpen={Boolean(editingBranch)}
                onClose={() => setEditingBranch(null)}
            />
        </div>
    );
}
