'use client';

import { useState } from 'react';
import {
  MapPin,
  Clock,
  DollarSign,
  CreditCard,
  ChefHat,
  ChevronRight,
} from 'lucide-react';
import { DriverOrderDto, PaymentMethod } from '@/shared/types/api';

interface AvailableOrdersTabProps {
  availableOrders: DriverOrderDto[];
  onClaimOrder: (orderId: string) => Promise<boolean>;
}

export function AvailableOrdersTab({
  availableOrders,
  onClaimOrder,
}: AvailableOrdersTabProps) {
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const handleClaim = async (orderId: string) => {
    setClaimingId(orderId);
    try {
      await onClaimOrder(orderId);
    } finally {
      setClaimingId(null);
    }
  };

  if (availableOrders.length === 0) {
    return (
      <div className="bg-surface-card border border-surface-border rounded-3xl p-8 sm:p-12 text-center shadow-xs space-y-4">
        <div className="w-16 h-16 rounded-full bg-surface-canvas border border-surface-border mx-auto flex items-center justify-center text-brand-primary">
          <ChefHat className="w-8 h-8" />
        </div>
        <div>
          <h3 className="font-display font-black text-xl uppercase tracking-tight text-text-strong">
            Sin Pedidos Listos en Cocina
          </h3>
          <p className="text-xs text-text-muted max-w-sm mx-auto mt-1 leading-relaxed">
            No hay comandas esperando despacho en este momento. El sistema te notificará con una alerta sonora en cuanto la cocina termine una preparación.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3.5 w-full">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
          Listos para despacho ({availableOrders.length})
        </span>
      </div>

      <div className="space-y-3">
        {availableOrders.map((order) => {
          const isCash = Number(order.paymentMethod) === PaymentMethod.Cash;
          const isClaiming = claimingId === order.orderId;
          const totalItems = order.items ? order.items.reduce((acc, i) => acc + i.quantity, 0) : 0;

          return (
            <div
              key={order.orderId}
              className="bg-surface-card border border-surface-border hover:border-brand-primary/40 rounded-3xl p-5 space-y-4 shadow-xs transition-all duration-200"
            >
              {/* Encabezado de la comanda */}
              <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider">
                      {order.branchName}
                    </span>
                    <span className="text-text-muted text-[10px]">•</span>
                    <span className="text-[10px] font-mono text-text-muted flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-text-strong font-display mt-0.5">
                    Orden #{order.orderNumber || order.orderId.slice(0, 8)}
                  </h3>
                </div>

                {isCash ? (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-status-warning/15 text-status-warning border border-status-warning/30 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    Cobrar ${order.total.toFixed(2)}
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-status-info/15 text-status-info border border-status-info/30 flex items-center gap-1">
                    <CreditCard className="w-3 h-3" />
                    Pagado
                  </span>
                )}
              </div>

              {/* Destino y Cliente */}
              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-bold text-text-strong">{order.customerName}</p>
                    <p className="text-text-base mt-0.5">{order.addressStreet}</p>
                    {order.addressReference && (
                      <p className="text-text-muted text-[11px] mt-0.5">
                        Ref: {order.addressReference}
                      </p>
                    )}
                  </div>
                </div>

                {order.items && order.items.length > 0 && (
                  <div className="bg-surface-canvas rounded-xl p-2.5 border border-surface-border text-[11px] text-text-muted">
                    <span className="font-bold text-text-strong">{totalItems} productos: </span>
                    {order.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                  </div>
                )}
              </div>

              {/* Pie de tarjeta con Importes y Acción */}
              <div className="flex items-center justify-between pt-2 border-t border-surface-border">
                <div>
                  <span className="text-[10px] text-text-muted block">Total comanda</span>
                  <span className="font-mono font-bold text-text-strong text-base">
                    ${order.total.toFixed(2)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleClaim(order.orderId)}
                  disabled={isClaiming}
                  className="flex items-center gap-1.5 px-5 py-3 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold uppercase tracking-wider rounded-full transition-all active:scale-95 disabled:opacity-50 shadow-md cursor-pointer"
                >
                  <span>{isClaiming ? 'Asignando...' : 'Tomar Pedido'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
