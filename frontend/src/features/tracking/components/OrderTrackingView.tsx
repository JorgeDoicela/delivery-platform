'use client';

import { useRouter } from 'next/navigation';
import { OrderStatus, PaymentMethod } from '@/shared/types/api';
import { ArrowLeft, Clock, Truck, AlertCircle, RefreshCw, Lock, LogIn, ShieldAlert } from 'lucide-react';
import { StatusTimeline } from './StatusTimeline';
import { OrderMap } from './OrderMap';
import { useOrderTracking } from '../hooks/useOrderTracking';
import { useTenantRoutes } from '@/shared/lib/tenant-routing';

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

const statusDescriptions: Record<OrderStatus, { title: string; desc: string }> = {
  [OrderStatus.Created]: {
    title: 'Pedido Registrado en Cola',
    desc: 'Tu comanda ha ingresado al sistema. En breve el equipo de cocina comenzará la preparación.',
  },
  [OrderStatus.PendingValidation]: {
    title: 'Comprobante en Revisión',
    desc: 'Validando la transferencia bancaria con el restaurante para enviar la comanda a cocina.',
  },
  [OrderStatus.Confirmed]: {
    title: 'Confirmado por el Local',
    desc: 'El restaurante confirmó tu orden. Pasa a asignación de cocina.',
  },
  [OrderStatus.InKitchen]: {
    title: 'Preparando tus Platillos',
    desc: 'Nuestros cocineros están horneando y preparando tus productos frescos en este momento.',
  },
  [OrderStatus.ReadyForDelivery]: {
    title: 'Listo y Empacado para Despacho',
    desc: 'Tu orden está empacada en el mostrador. El motorizado asignado está por retirarla.',
  },
  [OrderStatus.OnTheWay]: {
    title: 'Motorizado en Ruta a tu Puerta',
    desc: 'El repartidor retiró la comanda y se desplaza hacia tu dirección. Sigue su movimiento en el mapa en vivo.',
  },
  [OrderStatus.Delivered]: {
    title: 'Pedido Entregado con Éxito',
    desc: 'Tu pedido ha sido recibido en el domicilio indicado.',
  },
  [OrderStatus.Cancelled]: {
    title: 'Orden Cancelada',
    desc: 'Esta orden fue cancelada. Contacta al soporte si tienes dudas sobre tu pago.',
  },
};

interface OrderTrackingViewProps {
  orderId: string;
}

export function OrderTrackingView({ orderId }: OrderTrackingViewProps) {
  const router = useRouter();
  const routes = useTenantRoutes();
  const { order, loading, error, driverLocation, refresh } = useOrderTracking({ orderId });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-text-muted">
        <RefreshCw className="h-8 w-8 animate-spin text-brand-primary mb-4" />
        <p className="text-sm font-medium">Cargando estado del pedido...</p>
      </div>
    );
  }

  if (error || !order) {
    if (error === 'AUTH_REQUIRED') {
      return (
        <div className="max-w-xl mx-auto my-12 p-8 bg-surface-card border border-surface-border rounded-3xl text-center shadow-lg space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 text-brand-primary mx-auto flex items-center justify-center">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wide font-display text-text-strong">
            Autenticación Requerida
          </h2>
          <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
            Este pedido pertenece a una cuenta de usuario registrada. Para consultar el seguimiento satelital y el estado en horno en tiempo real, inicia sesión con la cuenta correspondiente.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => router.push(`${routes.getLoginHref()}?redirect=/rastreo/${orderId}`)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs uppercase tracking-wider rounded-full font-black transition-all shadow-md active:scale-95 cursor-pointer font-display"
            >
              <LogIn className="h-4 w-4" />
              <span>Iniciar Sesión</span>
            </button>
            <button
              onClick={() => router.push(routes.getRastreoHref())}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-surface-card hover:bg-surface-card-hover border border-surface-border text-text-strong text-xs uppercase tracking-wider rounded-full font-bold transition-all active:scale-95 cursor-pointer font-display"
            >
              <span>Volver a Rastreo</span>
            </button>
          </div>
        </div>
      );
    }

    if (error === 'FORBIDDEN') {
      return (
        <div className="max-w-xl mx-auto my-12 p-8 bg-surface-card border border-status-danger/30 rounded-3xl text-center shadow-lg space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-status-danger/10 text-status-danger mx-auto flex items-center justify-center">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wide font-display text-text-strong">
            Acceso Denegado
          </h2>
          <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
            Esta comanda pertenece a otra cuenta de usuario. Por razones de seguridad y privacidad, solo el comensal propietario o el personal del restaurante pueden consultar el mapa de despacho.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => router.push(routes.getRastreoHref())}
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs uppercase tracking-wider rounded-full font-black transition-all shadow-md active:scale-95 cursor-pointer font-display"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Volver a Mis Pedidos</span>
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-surface-card border border-surface-border rounded-3xl text-center shadow-lg">
        <AlertCircle className="h-10 w-10 text-status-danger mx-auto mb-3" />
        <h2 className="text-xl font-black uppercase tracking-wide font-display text-text-strong mb-2">Error al consultar el pedido</h2>
        <p className="text-xs sm:text-sm text-text-muted mb-6">{error || 'La orden no existe o fue cancelada.'}</p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => refresh()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-surface-card hover:bg-surface-card-hover border border-surface-border text-text-strong text-xs uppercase tracking-wider rounded-full font-bold transition-all active:scale-95"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reintentar
          </button>
          <button
            onClick={() => router.push(routes.getHomeHref())}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs uppercase tracking-wider rounded-full font-black transition-all shadow-md active:scale-95 cursor-pointer font-display"
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
        onClick={() => router.push(routes.getHomeHref())}
        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-muted hover:text-brand-primary transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a la carta
      </button>

      {/* Grid de 2 Columnas para Ancho Completo */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna Izquierda: Estado del Pedido + Mapa Vectorial */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-surface-border-subtle">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">
                  {order.branchName}
                </span>
                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-text-strong font-display mt-1">
                  Pedido #{order.orderNumber && order.orderNumber > 0 ? order.orderNumber : order.orderId.slice(0, 8)}
                </h1>
                <p className="text-xs text-text-muted mt-1">
                  Cliente: <strong className="text-text-strong">{order.customerName}</strong> ({order.customerPhone})
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    order.status === OrderStatus.Cancelled
                      ? 'bg-status-danger/15 text-status-danger border border-status-danger/30'
                      : order.status === OrderStatus.Delivered
                      ? 'bg-status-success/15 text-status-success border border-status-success/30'
                      : 'bg-neutral-900 text-white border border-neutral-800'
                  }`}
                >
                  {statusLabels[order.status as OrderStatus] || `Estado ${order.status}`}
                </span>
              </div>
            </div>

            {/* Stepper de Progreso */}
            <StatusTimeline status={order.status as OrderStatus} />

            {/* Banner Descriptivo en Vivo según la Etapa del Despacho */}
            {statusDescriptions[order.status as OrderStatus] && (
              <div className="mt-5 p-4 rounded-2xl bg-surface-canvas border border-surface-border flex items-start gap-3 text-xs">
                <div className="p-2 rounded-xl bg-brand-primary/10 text-brand-primary shrink-0 mt-0.5">
                  <Truck className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold uppercase tracking-wider font-display text-text-strong">
                    {statusDescriptions[order.status as OrderStatus].title}
                  </h3>
                  <p className="text-text-muted mt-0.5 leading-relaxed">
                    {statusDescriptions[order.status as OrderStatus].desc}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Mapa de Rastreo Vectorial MapLibre GL JS */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <Truck className="h-5 w-5 text-brand-primary animate-pulse" />
              <h2 className="text-sm font-bold text-text-strong uppercase tracking-wider font-display">
                Ruta y Seguimiento en Vivo
              </h2>
            </div>
            <OrderMap
              origin={
                order.branchLatitude && order.branchLongitude
                  ? {
                      latitude: order.branchLatitude,
                      longitude: order.branchLongitude,
                      label: order.branchName,
                    }
                  : undefined
              }
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
        <div className="lg:col-span-5 bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-text-strong uppercase tracking-wider font-display mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-text-muted" />
            Resumen de Artículos
          </h2>
          <div className="space-y-4 divide-y divide-surface-border-subtle">
            {order.items.map((item) => (
              <div key={item.id} className="pt-3 first:pt-0 flex justify-between items-start text-sm">
                <div>
                  <p className="text-text-strong font-bold">
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
                <span className="font-mono font-bold text-text-strong text-sm tabular-nums">${item.lineTotal.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-surface-border-subtle mt-6 pt-4 space-y-1.5 text-xs text-text-muted">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-mono text-text-strong tabular-nums">${order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Costo de Envío</span>
              <span className="font-mono text-text-strong tabular-nums">${order.deliveryFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-text-strong pt-2 border-t border-surface-border font-display uppercase tracking-wide">
              <span>Total</span>
              <span className="font-mono text-lg font-black text-brand-primary tabular-nums">${order.total.toFixed(2)}</span>
            </div>
          </div>

          {order.paymentMethod === PaymentMethod.Cash && order.cashAmountPaid && (
            <div className="mt-4 p-3.5 bg-surface-canvas border border-surface-border rounded-2xl text-xs text-text-base">
              Paga con billete de: <strong className="text-text-strong font-mono">${order.cashAmountPaid.toFixed(2)}</strong>.
              Vuelto a entregar: <strong className="text-brand-primary font-mono font-bold">${(order.changeDue ?? 0).toFixed(2)}</strong>.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

