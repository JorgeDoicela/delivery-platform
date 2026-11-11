"use client";

import { useState, useMemo } from "react";
import { useKitchenOrders } from "../hooks/useKitchenOrders";
import { KitchenTicketCard } from "./KitchenTicketCard";
import { OrderStatus } from "@/shared/types/api";
import { Volume2, Building2 } from "lucide-react";
import { kitchenAlertSound } from "../lib/sound";
import { Select, type SelectOption } from "@/shared/components/Select";
import { useBranchesQuery, useCurrentTenantQuery } from "@/features/tenant";
import { useAuthStore, UserRole } from "@/features/auth";

export function KitchenView() {
  const { data: tenant } = useCurrentTenantQuery();
  const { data: branchesData } = useBranchesQuery();
  const rawBranchId = useAuthStore((s) => s.user?.branchId);
  const userBranchId = useMemo(() => {
    if (rawBranchId === null || rawBranchId === undefined) return null;
    const parsed = Number(rawBranchId);
    return Number.isNaN(parsed) ? null : parsed;
  }, [rawBranchId]);

  const branches = useMemo(
    () => branchesData ?? tenant?.branches ?? [],
    [branchesData, tenant?.branches]
  );

  const branchOptions = useMemo<SelectOption<number>[]>(
    () =>
      branches.map((b) => ({
        value: b.id,
        label: b.name,
      })),
    [branches]
  );

  const user = useAuthStore((s) => s.user);
  const isBranchScopedStaff =
    (user?.role === "KitchenStaff" ||
      user?.role === UserRole.KitchenStaff ||
      user?.role === "Cashier" ||
      user?.role === UserRole.Cashier ||
      Number(user?.role) === 5 ||
      Number(user?.role) === 4) &&
    Boolean(userBranchId);

  const [selectedBranchId, setSelectedBranchId] = useState<number>(userBranchId ?? 1);
  const branchId: number =
    isBranchScopedStaff && userBranchId
      ? userBranchId
      : branches.length > 0 && !branches.some((b) => b.id === selectedBranchId)
        ? (userBranchId && branches.some((b) => b.id === userBranchId)
            ? userBranchId
            : branches[0].id)
        : selectedBranchId;

  const activeBranch = branches.find((b) => b.id === branchId);

  const { orders, error, connectionStatus, advanceOrderStatus } =
    useKitchenOrders(branchId);

  const confirmedOrders = orders.filter((o) => o.status === OrderStatus.Confirmed);
  const inKitchenOrders = orders.filter((o) => o.status === OrderStatus.InKitchen);
  const readyOrders = orders.filter((o) => o.status === OrderStatus.ReadyForDelivery);

  const [mobileColumn, setMobileColumn] = useState<"confirmed" | "inkitchen" | "ready">("confirmed");

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-surface-border gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wide text-text-strong font-display">
              Pantalla de Cocina (KDS) • {tenant?.name}
            </h1>
            <p className="text-xs text-text-muted mt-0.5">
              Despacho en secuencia FIFO y actualización en tiempo real por sucursal
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isBranchScopedStaff ? (
            <div className="flex items-center gap-2 bg-surface-card border border-surface-border rounded-full px-3.5 py-1.5 shadow-xs">
              <Building2 className="h-4 w-4 text-brand-primary" />
              <span className="text-xs text-text-strong font-bold uppercase tracking-wider">
                {activeBranch?.name || `Sucursal #${branchId}`}
              </span>
              <span className="text-[9px] bg-brand-primary/10 text-brand-primary font-bold uppercase px-2 py-0.5 rounded-full font-mono">
                Sede Asignada
              </span>
            </div>
          ) : (
            <Select<number>
              options={branchOptions}
              value={branchId}
              onChange={(val) => setSelectedBranchId(Number(val))}
              size="sm"
              leftIcon={Building2}
              variant="surface"
              className="w-auto min-w-[170px]"
              triggerClassName="!rounded-full !py-1.5 !px-3.5 shadow-xs font-bold uppercase tracking-wider text-xs"
            />
          )}

          <button
            onClick={() => kitchenAlertSound.playNewOrderChime()}
            title="Probar sonido de comanda"
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-surface-card hover:bg-surface-card-hover border border-surface-border rounded-full text-xs font-bold uppercase tracking-wider text-text-strong transition-colors cursor-pointer shadow-xs"
          >
            <Volume2 className="h-4 w-4 text-brand-accent" />
            <span className="hidden sm:inline">Probar Sonido</span>
          </button>

          <div
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border shadow-xs ${
              connectionStatus === "connected"
                ? "bg-status-success/15 text-status-success border-status-success/30"
                : connectionStatus === "connecting"
                ? "bg-status-warning/15 text-status-warning border-status-warning/30"
                : "bg-status-danger/15 text-status-danger border-status-danger/30"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                connectionStatus === "connected"
                  ? "bg-status-success animate-pulse"
                  : connectionStatus === "connecting"
                  ? "bg-status-warning animate-ping"
                  : "bg-status-danger"
              }`}
            />
            <span>
              {connectionStatus === "connected"
                ? "En Vivo • KDS"
                : connectionStatus === "connecting"
                ? "Reconectando..."
                : "Sin Conexión"}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-status-danger/15 border border-status-danger/30 text-status-danger text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Selector de Columnas en Dispositivos Móviles (< md) */}
      <div className="flex md:hidden items-center gap-1.5 p-1 bg-surface-card border border-surface-border rounded-2xl shadow-xs">
        <button
          type="button"
          onClick={() => setMobileColumn("confirmed")}
          className={`flex-1 py-2 px-2 rounded-xl text-[11px] font-black uppercase font-display tracking-wide transition-all flex items-center justify-center gap-1.5 ${
            mobileColumn === "confirmed"
              ? "bg-status-warning text-neutral-950 shadow-sm"
              : "text-text-muted hover:text-text-strong"
          }`}
        >
          <span>Espera</span>
          <span className="font-mono text-[10px] font-bold bg-black/15 px-1.5 py-0.2 rounded-full">
            {confirmedOrders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMobileColumn("inkitchen")}
          className={`flex-1 py-2 px-2 rounded-xl text-[11px] font-black uppercase font-display tracking-wide transition-all flex items-center justify-center gap-1.5 ${
            mobileColumn === "inkitchen"
              ? "bg-status-info text-white shadow-sm"
              : "text-text-muted hover:text-text-strong"
          }`}
        >
          <span>Horno</span>
          <span className="font-mono text-[10px] font-bold bg-white/20 px-1.5 py-0.2 rounded-full">
            {inKitchenOrders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMobileColumn("ready")}
          className={`flex-1 py-2 px-2 rounded-xl text-[11px] font-black uppercase font-display tracking-wide transition-all flex items-center justify-center gap-1.5 ${
            mobileColumn === "ready"
              ? "bg-status-success text-white shadow-sm"
              : "text-text-muted hover:text-text-strong"
          }`}
        >
          <span>Listos</span>
          <span className="font-mono text-[10px] font-bold bg-white/20 px-1.5 py-0.2 rounded-full">
            {readyOrders.length}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[calc(100vh-180px)]">
        {/* Columna 1: En Espera */}
        <div
          className={`bg-surface-card rounded-2xl border border-surface-border p-4 flex flex-col shadow-xs transition-colors duration-200 ${
            mobileColumn === "confirmed" ? "flex" : "hidden md:flex"
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-surface-border text-xs font-black uppercase tracking-wider font-display text-status-warning">
            <span>EN ESPERA (CONFIRMADOS)</span>
            <span className="bg-status-warning/20 text-status-warning px-2.5 py-0.5 rounded-full border border-status-warning/40 font-mono font-bold">
              {confirmedOrders.length}
            </span>
          </div>

          <div className="flex-1 mt-3 space-y-3 overflow-y-auto max-h-[calc(100vh-250px)] md:max-h-[calc(100vh-220px)] pr-1">
            {confirmedOrders.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-xs text-text-muted font-medium border border-dashed border-surface-border rounded-xl bg-surface-canvas">
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

        {/* Columna 2: En Preparación */}
        <div
          className={`bg-surface-card rounded-2xl border border-surface-border p-4 flex flex-col shadow-xs transition-colors duration-200 ${
            mobileColumn === "inkitchen" ? "flex" : "hidden md:flex"
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-surface-border text-xs font-black uppercase tracking-wider font-display text-status-info">
            <span>EN PREPARACIÓN (HORNO)</span>
            <span className="bg-status-info/20 text-status-info px-2.5 py-0.5 rounded-full border border-status-info/40 font-mono font-bold">
              {inKitchenOrders.length}
            </span>
          </div>

          <div className="flex-1 mt-3 space-y-3 overflow-y-auto max-h-[calc(100vh-250px)] md:max-h-[calc(100vh-220px)] pr-1">
            {inKitchenOrders.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-xs text-text-muted font-medium border border-dashed border-surface-border rounded-xl bg-surface-canvas">
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

        {/* Columna 3: Listos para Despacho */}
        <div
          className={`bg-surface-card rounded-2xl border border-surface-border p-4 flex flex-col shadow-xs transition-colors duration-200 ${
            mobileColumn === "ready" ? "flex" : "hidden md:flex"
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-surface-border text-xs font-black uppercase tracking-wider font-display text-status-success">
            <span>LISTOS PARA DESPACHO</span>
            <span className="bg-status-success/20 text-status-success px-2.5 py-0.5 rounded-full border border-status-success/40 font-mono font-bold">
              {readyOrders.length}
            </span>
          </div>

          <div className="flex-1 mt-3 space-y-3 overflow-y-auto max-h-[calc(100vh-250px)] md:max-h-[calc(100vh-220px)] pr-1">
            {readyOrders.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-xs text-text-muted font-medium border border-dashed border-surface-border rounded-xl bg-surface-canvas">
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
