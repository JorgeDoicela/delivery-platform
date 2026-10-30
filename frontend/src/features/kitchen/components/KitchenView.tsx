"use client";

import { useState, useMemo } from "react";
import { useKitchenOrders } from "../hooks/useKitchenOrders";
import { KitchenTicketCard } from "./KitchenTicketCard";
import { OrderStatus } from "@/shared/types/api";
import { RefreshCw, Radio, Volume2, Building2 } from "lucide-react";
import { kitchenAlertSound } from "../lib/sound";
import { useBranchesQuery, useCurrentTenantQuery } from "@/features/tenant";

export function KitchenView() {
  const { data: tenant } = useCurrentTenantQuery();
  const { data: branchesData } = useBranchesQuery();
  const branches = useMemo(
    () => branchesData ?? tenant?.branches ?? [],
    [branchesData, tenant?.branches]
  );

  const [selectedBranchId, setSelectedBranchId] = useState<number>(1);
  const branchId =
    branches.length > 0 && !branches.some((b) => b.id === selectedBranchId)
      ? branches[0].id
      : selectedBranchId;

  const { orders, loading, error, connectionStatus, refresh, advanceOrderStatus } =
    useKitchenOrders(branchId);

  const confirmedOrders = orders.filter((o) => o.status === OrderStatus.Confirmed);
  const inKitchenOrders = orders.filter((o) => o.status === OrderStatus.InKitchen);
  const readyOrders = orders.filter((o) => o.status === OrderStatus.ReadyForDelivery);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-surface-dark-border gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wide text-text-inverse-strong font-display">
              Pantalla de Cocina (KDS) • {tenant?.name}
            </h1>
            <p className="text-xs text-text-inverse-muted mt-0.5">
              Despacho en secuencia FIFO y actualización en tiempo real por sucursal
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-surface-dark-card border border-surface-dark-border rounded-full px-3.5 py-1.5">
            <Building2 className="h-4 w-4 text-brand-primary" />
            <select
              value={branchId}
              onChange={(e) => setSelectedBranchId(Number(e.target.value))}
              className="bg-transparent text-xs text-text-inverse-strong font-bold uppercase tracking-wider focus:outline-none cursor-pointer"
            >
              {branches.map((branch) => (
                <option
                  key={branch.id}
                  value={branch.id}
                  className="bg-surface-dark-card text-text-inverse-strong"
                >
                  {branch.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => kitchenAlertSound.playNewOrderChime()}
            title="Probar sonido de comanda"
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-surface-dark-card hover:bg-surface-dark-hover border border-surface-dark-border rounded-full text-xs font-bold uppercase tracking-wider text-text-inverse-base transition-colors"
          >
            <Volume2 className="h-4 w-4 text-brand-accent" />
            <span className="hidden sm:inline">Probar Sonido</span>
          </button>

          <button
            onClick={() => refresh()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-surface-dark-card hover:bg-surface-dark-hover border border-surface-dark-border rounded-full text-xs font-bold uppercase tracking-wider text-text-inverse-base transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-brand-primary" : ""}`} />
            <span className="hidden sm:inline">Refrescar</span>
          </button>

          <div
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
              connectionStatus === "connected"
                ? "bg-status-success/20 text-status-success border-status-success/40"
                : connectionStatus === "connecting"
                ? "bg-status-warning/20 text-status-warning border-status-warning/40"
                : "bg-status-danger/20 text-status-danger border-status-danger/40"
            }`}
          >
            <Radio className="h-3.5 w-3.5" />
            <span className="capitalize">{connectionStatus}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-status-danger/20 border border-status-danger/40 rounded-2xl text-xs text-status-danger">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[calc(100vh-160px)]">
        <div className="bg-surface-dark-card/50 rounded-2xl border border-surface-dark-border p-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-surface-dark-border text-xs font-black uppercase tracking-wider font-display text-status-warning">
            <span>EN ESPERA (CONFIRMADOS)</span>
            <span className="bg-status-warning/20 text-status-warning px-2.5 py-0.5 rounded-full border border-status-warning/40 font-mono font-bold">
              {confirmedOrders.length}
            </span>
          </div>

          <div className="flex-1 mt-3 space-y-3 overflow-y-auto max-h-[calc(100vh-220px)] pr-1">
            {confirmedOrders.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-xs text-text-inverse-subtle font-medium border border-dashed border-surface-dark-border rounded-xl">
                Sin pedidos en espera
              </div>
            ) : (
              confirmedOrders.map((order) => (
                <KitchenTicketCard
                  key={order.orderId}
                  order={order}
                  onAdvance={advanceOrderStatus}
                />
              ))
            )}
          </div>
        </div>

        <div className="bg-surface-dark-card/50 rounded-2xl border border-surface-dark-border p-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-surface-dark-border text-xs font-black uppercase tracking-wider font-display text-status-info">
            <span>EN PREPARACIÓN (HORNO)</span>
            <span className="bg-status-info/20 text-status-info px-2.5 py-0.5 rounded-full border border-status-info/40 font-mono font-bold">
              {inKitchenOrders.length}
            </span>
          </div>

          <div className="flex-1 mt-3 space-y-3 overflow-y-auto max-h-[calc(100vh-220px)] pr-1">
            {inKitchenOrders.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-xs text-text-inverse-subtle font-medium border border-dashed border-surface-dark-border rounded-xl">
                Sin pedidos en preparación
              </div>
            ) : (
              inKitchenOrders.map((order) => (
                <KitchenTicketCard
                  key={order.orderId}
                  order={order}
                  onAdvance={advanceOrderStatus}
                />
              ))
            )}
          </div>
        </div>

        <div className="bg-surface-dark-card/50 rounded-2xl border border-surface-dark-border p-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-surface-dark-border text-xs font-black uppercase tracking-wider font-display text-status-success">
            <span>LISTOS PARA DESPACHO</span>
            <span className="bg-status-success/20 text-status-success px-2.5 py-0.5 rounded-full border border-status-success/40 font-mono font-bold">
              {readyOrders.length}
            </span>
          </div>

          <div className="flex-1 mt-3 space-y-3 overflow-y-auto max-h-[calc(100vh-220px)] pr-1">
            {readyOrders.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-xs text-text-inverse-subtle font-medium border border-dashed border-surface-dark-border rounded-xl">
                Sin pedidos listos para entrega
              </div>
            ) : (
              readyOrders.map((order) => (
                <KitchenTicketCard
                  key={order.orderId}
                  order={order}
                  onAdvance={advanceOrderStatus}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
