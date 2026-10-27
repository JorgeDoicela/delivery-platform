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
  let timerBadgeColor = 'bg-emerald-950 text-emerald-400 border-emerald-800';
  if (elapsedMinutes >= 25) {
    timerBadgeColor = 'bg-red-950 text-red-400 border-red-800 animate-pulse';
  } else if (elapsedMinutes >= 15) {
    timerBadgeColor = 'bg-amber-950 text-amber-400 border-amber-800';
  }

  const isTakeout = order.deliveryType === DeliveryType.Takeout;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg shadow-lg flex flex-col justify-between overflow-hidden">
      {/* Cabecera del Ticket */}
      <div className="p-3 bg-neutral-950/60 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-white bg-neutral-800 px-2 py-0.5 rounded">
            #{order.orderId.slice(0, 8)}
          </span>
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider ${
              isTakeout
                ? 'bg-blue-950 text-blue-400 border border-blue-800'
                : 'bg-neutral-800 text-neutral-300'
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
      <div className="px-3 pt-2 pb-1 border-b border-neutral-800/60 text-xs">
        <p className="font-bold text-white truncate">{order.customerName}</p>
        {!isTakeout && order.addressStreet && (
          <p className="text-neutral-400 text-[11px] truncate">
            {order.addressStreet} {order.addressReference && `(${order.addressReference})`}
          </p>
        )}
      </div>

      {/* Lista de Items */}
      <div className="p-3 space-y-2.5 flex-1 overflow-y-auto max-h-60 divide-y divide-neutral-800/40">
        {order.items.map((item, idx) => (
          <div key={idx} className="pt-2 first:pt-0">
            <div className="flex items-start gap-2">
              <span className="font-mono font-black text-amber-400 text-sm w-5 text-right">
                {item.quantity}x
              </span>
              <div className="flex-1">
                <p className="text-white text-xs font-bold leading-tight">{item.productName}</p>
                {item.modifiers && item.modifiers.length > 0 && (
                  <ul className="mt-1 space-y-0.5">
                    {item.modifiers.map((m, mIdx) => (
                      <li
                        key={mIdx}
                        className="text-[11px] font-medium text-amber-200/80 bg-neutral-950/80 px-1.5 py-0.5 rounded border border-neutral-800 inline-block mr-1 mb-1"
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
      <div className="p-3 bg-neutral-950/80 border-t border-neutral-800">
        {order.status === OrderStatus.Confirmed && (
          <button
            onClick={() => handleAdvance(OrderStatus.InKitchen)}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold rounded transition-colors disabled:opacity-50"
          >
            <ChefHat className="h-4 w-4" />
            {isSubmitting ? 'Iniciando...' : 'Iniciar en Cocina'}
          </button>
        )}

        {order.status === OrderStatus.InKitchen && (
          <button
            onClick={() => handleAdvance(OrderStatus.ReadyForDelivery)}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded transition-colors disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            {isSubmitting ? 'Guardando...' : 'Listo para Reparto'}
          </button>
        )}

        {order.status === OrderStatus.ReadyForDelivery && (
          <button
            onClick={() => handleAdvance(OrderStatus.OnTheWay)}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded transition-colors disabled:opacity-50"
          >
            <Bike className="h-4 w-4" />
            {isSubmitting ? 'Despachando...' : 'Despachar / En Camino'}
          </button>
        )}
      </div>
    </div>
  );
}
