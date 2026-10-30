"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/lib/api-client";
import type { BranchCapacityResponse } from "@/shared/types/api";
import { useCurrentTenantQuery, useBranchesQuery } from "@/features/tenant";
import {
    Building2,
    MapPin,
    Phone,
    RefreshCw,
    Clock,
    AlertTriangle,
    Layers,
} from "lucide-react";

export function BranchManagementView() {
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-surface-dark-border gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-brand-primary flex items-center justify-center text-white">
                            <Building2 className="w-4 h-4" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wide text-text-inverse-strong font-display">
                            Sucursales y Capacidad • {tenant?.name}
                        </h1>
                    </div>
                    <p className="text-xs text-text-inverse-muted mt-1 leading-relaxed">
                        Supervisión de cobertura PostGIS y capacidad por ranuras de 20 min en Redis.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-[10px] text-text-inverse-muted font-mono uppercase tracking-wider">
                        Actualizado: {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : "Consultando..."}
                    </span>
                    <button
                        onClick={() => void refetch()}
                        disabled={isFetching}
                        className="flex items-center gap-1.5 px-4 py-2 bg-surface-dark-card hover:bg-surface-dark-hover border border-surface-dark-border rounded-full text-xs font-bold uppercase tracking-wider text-text-inverse-strong transition-all active:scale-95 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-brand-primary" : ""}`} />
                        <span>Refrescar</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {branches.map((branch) => {
                    const cap = capacities[branch.id];

                    return (
                        <div
                            key={branch.id}
                            className="bg-surface-dark-card border border-surface-dark-border rounded-3xl p-6 sm:p-7 space-y-5 shadow-xl flex flex-col justify-between"
                        >
                            <div className="space-y-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-200 bg-neutral-800 border border-neutral-700 px-2.5 py-0.5 rounded-full">
                                            ID Sucursal #{branch.id}
                                        </span>
                                        <h3 className="text-xl font-black uppercase tracking-tight text-text-inverse-strong font-display mt-2">
                                            {branch.name}
                                        </h3>
                                        <p className="text-xs text-text-inverse-muted mt-0.5">
                                            Horario: {branch.openingTime} - {branch.closingTime}
                                        </p>
                                    </div>
                                </div>

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
                                            Geo Centro: {branch.latitude.toFixed(4)}, {branch.longitude.toFixed(4)}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-text-inverse-muted font-medium">
                                            Carga en Cocina (Ranura 20 min):
                                        </span>
                                        <span className="font-mono font-bold text-text-inverse-strong">
                                            {cap
                                                ? `${cap.currentSlotOrders} / ${cap.maxOrdersPerSlot} órdenes`
                                                : `0 / ${branch.maxOrdersPerSlot} órdenes`}
                                        </span>
                                    </div>

                                    <div className="w-full bg-surface-dark rounded-full h-2.5 overflow-hidden border border-surface-dark-border">
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
