'use client';

import { useRouter } from 'next/navigation';
import { OrderStatus, PaymentMethod } from '@/shared/types/api';
import { ArrowLeft, Clock, Truck, AlertCircle, RefreshCw } from 'lucide-react';
import { StatusTimeline } from './StatusTimeline';
import { OrderMap } from './OrderMap';
import { useOrderTracking } from '../hooks/useOrderTracking';

const statusLabels: Record<OrderStatus, string> = {
  [OrderStatus.Created]: 'Pedido Registrado',
  [OrderStatus.PendingValidation]: 'Pendiente de Comprobante',
  [OrderStatus.Confirmed]: 'Confirmado / En Cola',
  [OrderStatus.InKitchen]: 'En Preparación (Horno)',
  [OrderStatus.ReadyForDelivery]: 'Listo para Despacho',
  [OrderStatus.OnTheWay]: 'En Camino',
  [OrderStatus.Delivered]: 'Entregado',
  [OrderStatus.Cancelled]: 'Cancelado',
};

interface OrderTrackingViewProps {
  orderId: string;
}

export function OrderTrackingView({ orderId }: OrderTrackingViewProps) {
  const router = useRouter();
  const { order, loading, error, driverLocation, refresh } = useOrderTracking({ orderId });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-text-muted">
        <RefreshCw className="h-8 w-8 animate-spin text-brand-accent mb-4" />
        <p className="text-sm font-medium">Cargando estado del pedido...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 bg-status-danger/10 border border-status-danger/30 rounded-2xl text-center shadow-lg">
        <AlertCircle className="h-10 w-10 text-status-danger mx-auto mb-3" />
        <h2 className="text-lg font-bold text-text-strong mb-2">Error al consultar el pedido</h2>
        <p className="text-sm text-text-muted mb-6">{error || 'La orden no existe o fue cancelada.'}</p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => refresh()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-surface-card hover:bg-surface-card-hover border border-surface-border text-text-strong text-xs rounded-xl font-semibold transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reintentar
          </button>
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-text-inverse-strong text-xs rounded-xl font-semibold transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver a la carta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <button
        onClick={() => router.push('/')}
        className="inline-flex items-center gap-2 text-xs text-text-muted hover:text-text-strong transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a la tienda
      </button>

      {/* Grid de 2 Columnas para Ancho Completo */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna Izquierda: Estado del Pedido + Mapa Vectorial */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-surface-card border border-surface-border rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-surface-border-subtle">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-accent">
                  {order.branchName}
                </span>
                <h1 className="text-xl font-bold text-text-strong mt-1">Pedido #{order.orderId}</h1>
                <p className="text-xs text-text-muted mt-1">
                  Cliente: {order.customerName} ({order.customerPhone})
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                    order.status === OrderStatus.Cancelled
                      ? 'bg-status-danger/20 text-status-danger border border-status-danger/40'
                      : order.status === OrderStatus.Delivered
                      ? 'bg-status-success/20 text-status-success border border-status-success/40'
                      : 'bg-status-warning/20 text-status-warning border border-status-warning/40'
                  }`}
                >
                  {statusLabels[order.status as OrderStatus] || `Estado ${order.status}`}
                </span>
              </div>
            </div>

            {/* Stepper de Progreso */}
            <StatusTimeline status={order.status as OrderStatus} />
          </div>

          {/* Mapa de Rastreo Vectorial MapLibre GL JS */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Truck className="h-5 w-5 text-brand-accent animate-pulse" />
              <h2 className="text-sm font-semibold text-text-strong uppercase tracking-wider">
                Ruta y Seguimiento en Vivo
              </h2>
            </div>
            <OrderMap
              destination={
                order.deliveryLatitude && order.deliveryLongitude
                  ? { latitude: order.deliveryLatitude, longitude: order.deliveryLongitude }
                  : undefined
              }
              driverLocation={driverLocation}
            />
          </div>
        </div>

        {/* Columna Derecha: Detalle de Productos */}
        <div className="lg:col-span-5 bg-surface-card border border-surface-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-text-strong uppercase tracking-wider mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-text-muted" />
            Resumen de Artículos
          </h2>
          <div className="space-y-4 divide-y divide-surface-border-subtle">
            {order.items.map((item) => (
              <div key={item.id} className="pt-3 first:pt-0 flex justify-between items-start text-sm">
                <div>
                  <p className="text-text-strong font-medium">
                    {item.quantity}x {item.productName}
                  </p>
                  {item.modifiers && item.modifiers.length > 0 && (
                    <ul className="text-xs text-text-muted mt-1 list-disc list-inside space-y-0.5">
                      {item.modifiers.map((m) => (
                        <li key={m.id}>
                          {m.modifierName} {m.price > 0 && `(+$${m.price.toFixed(2)})`}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <span className="font-mono text-text-strong text-sm">${item.lineTotal.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-surface-border-subtle mt-6 pt-4 space-y-1.5 text-xs text-text-muted">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-mono text-text-strong">${order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Costo de Envío</span>
              <span className="font-mono text-text-strong">${order.deliveryFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-text-strong pt-2 border-t border-surface-border">
              <span>Total</span>
              <span className="font-mono text-brand-primary">${order.total.toFixed(2)}</span>
            </div>
          </div>

          {order.paymentMethod === PaymentMethod.Cash && order.cashAmountPaid && (
            <div className="mt-4 p-3 bg-surface-canvas border border-surface-border rounded-xl text-xs text-text-base">
              Paga con billete de: <strong className="text-text-strong">${order.cashAmountPaid.toFixed(2)}</strong>.
              Vuelto a entregar: <strong className="text-brand-accent">${(order.changeDue ?? 0).toFixed(2)}</strong>.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

