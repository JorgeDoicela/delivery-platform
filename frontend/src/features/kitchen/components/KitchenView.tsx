'use client';

import { useState } from 'react';
import { useKitchenOrders } from '../hooks/useKitchenOrders';
import { KitchenTicketCard } from './KitchenTicketCard';
import { OrderStatus } from '@/shared/types/api';
import { RefreshCw, Radio, Volume2, Building2 } from 'lucide-react';
import { kitchenAlertSound } from '../lib/sound';

export function KitchenView() {
  const [branchId, setBranchId] = useState<number>(1);
  const { orders, loading, error, connectionStatus, refresh, advanceOrderStatus } =
    useKitchenOrders(branchId);

  const confirmedOrders = orders.filter((o) => o.status === OrderStatus.Confirmed);
  const inKitchenOrders = orders.filter((o) => o.status === OrderStatus.InKitchen);
  const readyOrders = orders.filter((o) => o.status === OrderStatus.ReadyForDelivery);

  return (
    <div className="space-y-4">
      {/* Barra de Control KDS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-neutral-800 gap-3">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Pantalla de Cocina (KDS)</h1>
            <p className="text-xs text-neutral-400">
              Despacho en secuencia FIFO y actualización en tiempo real
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Selector de Sucursal */}
          <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1">
            <Building2 className="h-4 w-4 text-amber-500" />
            <select
              value={branchId}
              onChange={(e) => setBranchId(Number(e.target.value))}
              className="bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value={1} className="bg-neutral-900 text-white">
                Sucursal 1 - Norte
              </option>
              <option value={2} className="bg-neutral-900 text-white">
                Sucursal 2 - Sur
              </option>
            </select>
          </div>

          {/* Test de Alarma Sonora */}
          <button
            onClick={() => kitchenAlertSound.playNewOrderChime()}
            title="Probar sonido de comanda"
            className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded text-xs text-neutral-300 font-medium transition-colors"
          >
            <Volume2 className="h-4 w-4 text-amber-400" />
            <span className="hidden sm:inline">Probar Sonido</span>
          </button>

          {/* Refresco Manual */}
          <button
            onClick={() => refresh()}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded text-xs text-neutral-300 font-medium transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-amber-500' : ''}`} />
            <span className="hidden sm:inline">Refrescar</span>
          </button>

          {/* Estado de Señal SignalR */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold border ${
              connectionStatus === 'connected'
                ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                : connectionStatus === 'connecting'
                ? 'bg-amber-950/80 text-amber-400 border-amber-800'
                : 'bg-red-950/80 text-red-400 border-red-800'
            }`}
          >
            <Radio className="h-3.5 w-3.5" />
            <span className="capitalize">{connectionStatus}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-950/40 border border-red-800 rounded text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Grid de 3 Columnas FIFO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[calc(100vh-160px)]">
        {/* Columna 1: Por Entrar a Horno */}
        <div className="bg-neutral-900/50 rounded-lg border border-neutral-800 p-3 flex flex-col">
          <div className="flex items-center justify-between pb-2.5 border-b border-neutral-800 text-xs font-bold text-amber-400">
            <span>EN ESPERA (CONFIRMADOS)</span>
            <span className="bg-amber-950 text-amber-400 px-2 py-0.5 rounded border border-amber-800/80 font-mono">
              {confirmedOrders.length}
            </span>
          </div>

          <div className="flex-1 mt-3 space-y-3 overflow-y-auto max-h-[calc(100vh-220px)] pr-1">
            {confirmedOrders.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-xs text-neutral-500 font-medium border border-dashed border-neutral-800 rounded">
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

        {/* Columna 2: En Cocina / Horno */}
        <div className="bg-neutral-900/50 rounded-lg border border-neutral-800 p-3 flex flex-col">
          <div className="flex items-center justify-between pb-2.5 border-b border-neutral-800 text-xs font-bold text-blue-400">
            <span>EN PREPARACIÓN (HORNO)</span>
            <span className="bg-blue-950 text-blue-400 px-2 py-0.5 rounded border border-blue-800/80 font-mono">
              {inKitchenOrders.length}
            </span>
          </div>

          <div className="flex-1 mt-3 space-y-3 overflow-y-auto max-h-[calc(100vh-220px)] pr-1">
            {inKitchenOrders.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-xs text-neutral-500 font-medium border border-dashed border-neutral-800 rounded">
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
        <div className="bg-neutral-900/50 rounded-lg border border-neutral-800 p-3 flex flex-col">
          <div className="flex items-center justify-between pb-2.5 border-b border-neutral-800 text-xs font-bold text-emerald-400">
            <span>LISTOS PARA DESPACHO</span>
            <span className="bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800/80 font-mono">
              {readyOrders.length}
            </span>
          </div>

          <div className="flex-1 mt-3 space-y-3 overflow-y-auto max-h-[calc(100vh-220px)] pr-1">
            {readyOrders.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-xs text-neutral-500 font-medium border border-dashed border-neutral-800 rounded">
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

