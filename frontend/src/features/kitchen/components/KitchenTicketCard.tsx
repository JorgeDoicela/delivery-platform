'use client';

import { useState, useEffect } from 'react';
import { KitchenOrderTicketDto, OrderStatus, DeliveryType, PaymentMethod } from '@/shared/types/api';
import { Clock, ChefHat, CheckCircle2, Bike, Store, AlertTriangle, Receipt, ExternalLink, Check, X } from 'lucide-react';

interface KitchenTicketCardProps {
  order: KitchenOrderTicketDto;
  onAdvance: (orderId: string, nextStatus: OrderStatus) => Promise<void>;
  onApproveTransfer?: (orderId: string, isApproved: boolean, rejectionReason?: string) => Promise<void>;
  useKitchenWorkflow?: boolean;
  allowDirectCounterTakeoutDelivery?: boolean;
}

export function KitchenTicketCard({
  order,
  onAdvance,
  onApproveTransfer,
  useKitchenWorkflow = true,
  allowDirectCounterTakeoutDelivery = true,
}: KitchenTicketCardProps) {
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

  const handleApprove = async (isApproved: boolean) => {
    if (!onApproveTransfer) return;
    setIsSubmitting(true);
    try {
      await onApproveTransfer(order.orderId, isApproved);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Semáforo de tiempos
  let timerBadgeColor = 'bg-status-success/15 text-status-success border-status-success/30';
  if (elapsedMinutes >= 25) {
    timerBadgeColor = 'bg-status-danger/15 text-status-danger border-status-danger/30 animate-pulse';
  } else if (elapsedMinutes >= 15) {
    timerBadgeColor = 'bg-status-warning/15 text-status-warning border-status-warning/30';
  }

  const isTakeout = order.deliveryType === DeliveryType.Takeout;
  const isPendingValidation = order.status === OrderStatus.PendingValidation;

  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl shadow-sm flex flex-col justify-between overflow-hidden transition-colors duration-200">
      {/* Cabecera del Ticket */}
      <div className="p-3.5 bg-surface-canvas border-b border-surface-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-text-strong bg-surface-card px-2.5 py-0.5 rounded-full border border-surface-border">
            #{order.orderId.slice(0, 8)}
          </span>
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
              isTakeout
                ? 'bg-status-info/15 text-status-info border border-status-info/30'
                : 'bg-surface-card border border-surface-border text-text-strong'
            }`}
          >
            {isTakeout ? (
              <>
                <Store className="h-3 w-3" /> Mostrador
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
          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-mono font-bold ${timerBadgeColor}`}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>{elapsedMinutes}m</span>
          {elapsedMinutes >= 25 && <AlertTriangle className="h-3.5 w-3.5" />}
        </div>
      </div>

      {/* Datos del Cliente y Pago */}
      <div className="px-3.5 pt-2.5 pb-2 border-b border-surface-border text-xs space-y-1">
        <div className="flex items-center justify-between">
          <p className="font-bold text-text-strong truncate">{order.customerName}</p>
          {order.total !== undefined && order.total > 0 && (
            <span className="font-mono font-black text-brand-primary text-xs">
              ${order.total.toFixed(2)}
            </span>
          )}
        </div>
        {!isTakeout && order.addressStreet && (
          <p className="text-text-muted text-[11px] truncate">
            {order.addressStreet} {order.addressReference && `(${order.addressReference})`}
          </p>
        )}
        {order.paymentMethod === PaymentMethod.Cash && order.changeDue !== undefined && order.changeDue !== null && order.changeDue > 0 && (
          <p className="text-[11px] text-status-warning font-semibold">
            Cambio a entregar: ${order.changeDue.toFixed(2)}
          </p>
        )}
      </div>

      {/* Bloque especial de Transferencia Bancaria por Validar */}
      {isPendingValidation && (
        <div className="px-3.5 py-2.5 bg-status-warning/10 border-b border-status-warning/20 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-status-warning uppercase tracking-wider flex items-center gap-1">
              <Receipt className="h-3.5 w-3.5" /> Transferencia por validar
            </span>
            {order.transferReceiptUrl && (
              <a
                href={order.transferReceiptUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-primary hover:underline"
              >
                Ver Comprobante <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Lista de Items */}
      <div className="p-3.5 space-y-2.5 flex-1 overflow-y-auto max-h-60 divide-y divide-surface-border">
        {order.items.map((item, idx) => (
          <div key={idx} className="pt-2 first:pt-0">
            <div className="flex items-start gap-2">
              <span className="font-mono font-black text-brand-accent text-sm w-5 text-right">
                {item.quantity}x
              </span>
              <div className="flex-1">
                <p className="text-text-strong text-xs font-bold leading-tight">{item.productName}</p>
                {item.modifiers && item.modifiers.length > 0 && (
                  <ul className="mt-1 space-y-0.5">
                    {item.modifiers.map((m, mIdx) => (
                      <li
                        key={mIdx}
                        className="text-[10px] font-bold uppercase tracking-wider text-brand-accent bg-surface-canvas px-2 py-0.5 rounded-full border border-surface-border inline-block mr-1 mb-1"
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

      {/* Acciones de Flujo de Cocina y Mostrador */}
      <div className="p-3 bg-surface-canvas border-t border-surface-border">
        {isPendingValidation && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleApprove(false)}
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-1 py-2 px-3 bg-surface-card hover:bg-status-danger/10 text-status-danger border border-status-danger/30 text-xs font-bold uppercase tracking-wider rounded-full transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
              Rechazar
            </button>
            <button
              onClick={() => handleApprove(true)}
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-1 py-2 px-3 bg-status-success hover:bg-status-success/90 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Check className="h-3.5 w-3.5" />
              Aprobar
            </button>
          </div>
        )}

        {order.status === OrderStatus.Confirmed && (
          useKitchenWorkflow ? (
            <button
              onClick={() => handleAdvance(OrderStatus.InKitchen)}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <ChefHat className="h-4 w-4" />
              {isSubmitting ? 'Iniciando...' : 'Iniciar en Cocina'}
            </button>
          ) : isTakeout && allowDirectCounterTakeoutDelivery ? (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button
                onClick={() => handleAdvance(OrderStatus.ReadyForDelivery)}
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-surface-card hover:bg-status-info/10 text-status-info border border-status-info/30 text-xs font-bold uppercase tracking-wider rounded-full transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {isSubmitting ? 'Guardando...' : 'Marcar Listo'}
              </button>
              <button
                onClick={() => handleAdvance(OrderStatus.Delivered)}
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-status-success hover:bg-status-success/85 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Store className="h-3.5 w-3.5" />
                {isSubmitting ? 'Entregando...' : 'Entregar'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleAdvance(OrderStatus.ReadyForDelivery)}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-status-info hover:bg-status-info/85 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              {isSubmitting ? 'Guardando...' : isTakeout ? 'Listo en Mostrador' : 'Listo para Reparto'}
            </button>
          )
        )}

        {order.status === OrderStatus.InKitchen && (
          <button
            onClick={() => handleAdvance(OrderStatus.ReadyForDelivery)}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-status-info hover:bg-status-info/80 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <CheckCircle2 className="h-4 w-4" />
            {isSubmitting ? 'Guardando...' : isTakeout ? 'Listo en Mostrador' : 'Listo para Reparto'}
          </button>
        )}

        {order.status === OrderStatus.ReadyForDelivery && (
          isTakeout ? (
            <button
              onClick={() => handleAdvance(OrderStatus.Delivered)}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-status-success hover:bg-status-success/80 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Store className="h-4 w-4" />
              {isSubmitting ? 'Entregando...' : 'Entregar en Mostrador'}
            </button>
          ) : (
            <button
              onClick={() => handleAdvance(OrderStatus.OnTheWay)}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-status-success hover:bg-status-success/80 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Bike className="h-4 w-4" />
              {isSubmitting ? 'Despachando...' : 'Despachar / En Camino'}
            </button>
          )
        )}
      </div>
    </div>
  );
}
