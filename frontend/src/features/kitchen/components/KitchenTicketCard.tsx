'use client';

import { useState, useEffect } from 'react';
import { KitchenOrderTicketDto, OrderStatus, DeliveryType } from '@/shared/types/api';
import { Clock, ChefHat, CheckCircle2, Bike, Store, AlertTriangle } from 'lucide-react';

interface KitchenTicketCardProps {
  order: KitchenOrderTicketDto;
  onAdvance: (orderId: string, nextStatus: OrderStatus) => Promise<void>;
}

export function KitchenTicketCard({ order, onAdvance }: KitchenTicketCardProps) {
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const calcElapsed = () => {
      const created = new Date(order.createdAt).getTime();
      const now = Date.now();
      const diffMs = Math.max(0, now - created);
      setElapsedMinutes(Math.floor(diffMs / 60000));
    };

    calcElapsed();
    const interval = setInterval(calcElapsed, 30000);
    return () => clearInterval(interval);
  }, [order.createdAt]);

  const handleAdvance = async (nextStatus: OrderStatus) => {
    setIsSubmitting(true);
    try {
      await onAdvance(order.orderId, nextStatus);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Semáforo de tiempos
  let timerBadgeColor = 'bg-status-success/20 text-status-success border-status-success/40';
  if (elapsedMinutes >= 25) {
    timerBadgeColor = 'bg-status-danger/20 text-status-danger border-status-danger/40 animate-pulse';
  } else if (elapsedMinutes >= 15) {
    timerBadgeColor = 'bg-status-warning/20 text-status-warning border-status-warning/40';
  }

  const isTakeout = order.deliveryType === DeliveryType.Takeout;

  return (
    <div className="bg-surface-dark-card border border-surface-dark-border rounded-lg shadow-lg flex flex-col justify-between overflow-hidden">
      {/* Cabecera del Ticket */}
      <div className="p-3 bg-surface-dark/60 border-b border-surface-dark-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-text-inverse-strong bg-surface-dark-hover px-2 py-0.5 rounded">
            #{order.orderId.slice(0, 8)}
          </span>
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider ${
              isTakeout
                ? 'bg-status-info/20 text-status-info border border-status-info/40'
                : 'bg-surface-dark-hover text-text-inverse-base'
            }`}
          >
            {isTakeout ? (
              <>
                <Store className="h-3 w-3" /> Para Llevar
              </>
            ) : (
              <>
                <Bike className="h-3 w-3" /> Delivery
              </>
            )}
          </span>
        </div>

        {/* Cronómetro Semáforo */}
        <div
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-mono font-bold ${timerBadgeColor}`}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>{elapsedMinutes}m</span>
          {elapsedMinutes >= 25 && <AlertTriangle className="h-3.5 w-3.5" />}
        </div>
      </div>

      {/* Datos del Cliente */}
      <div className="px-3 pt-2 pb-1 border-b border-surface-dark-border/60 text-xs">
        <p className="font-bold text-text-inverse-strong truncate">{order.customerName}</p>
        {!isTakeout && order.addressStreet && (
          <p className="text-text-inverse-muted text-[11px] truncate">
            {order.addressStreet} {order.addressReference && `(${order.addressReference})`}
          </p>
        )}
      </div>

      {/* Lista de Items */}
      <div className="p-3 space-y-2.5 flex-1 overflow-y-auto max-h-60 divide-y divide-surface-dark-border/40">
        {order.items.map((item, idx) => (
          <div key={idx} className="pt-2 first:pt-0">
            <div className="flex items-start gap-2">
              <span className="font-mono font-black text-brand-accent text-sm w-5 text-right">
                {item.quantity}x
              </span>
              <div className="flex-1">
                <p className="text-text-inverse-strong text-xs font-bold leading-tight">{item.productName}</p>
                {item.modifiers && item.modifiers.length > 0 && (
                  <ul className="mt-1 space-y-0.5">
                    {item.modifiers.map((m, mIdx) => (
                      <li
                        key={mIdx}
                        className="text-[11px] font-medium text-brand-accent-light bg-surface-dark/80 px-1.5 py-0.5 rounded border border-surface-dark-border inline-block mr-1 mb-1"
                      >
                        + {m.modifierName}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Acciones de Flujo de Cocina */}
      <div className="p-3 bg-surface-dark/80 border-t border-surface-dark-border">
        {order.status === OrderStatus.Confirmed && (
          <button
            onClick={() => handleAdvance(OrderStatus.InKitchen)}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-brand-accent hover:bg-brand-accent-hover text-surface-dark text-xs font-bold rounded transition-colors disabled:opacity-50"
          >
            <ChefHat className="h-4 w-4" />
            {isSubmitting ? 'Iniciando...' : 'Iniciar en Cocina'}
          </button>
        )}

        {order.status === OrderStatus.InKitchen && (
          <button
            onClick={() => handleAdvance(OrderStatus.ReadyForDelivery)}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-status-info hover:bg-status-info/80 text-text-inverse-strong text-xs font-bold rounded transition-colors disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            {isSubmitting ? 'Guardando...' : 'Listo para Reparto'}
          </button>
        )}

        {order.status === OrderStatus.ReadyForDelivery && (
          <button
            onClick={() => handleAdvance(OrderStatus.OnTheWay)}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-status-success hover:bg-status-success/80 text-text-inverse-strong text-xs font-bold rounded transition-colors disabled:opacity-50"
          >
            <Bike className="h-4 w-4" />
            {isSubmitting ? 'Despachando...' : 'Despachar / En Camino'}
          </button>
        )}
      </div>
    </div>
  );
}
