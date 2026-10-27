'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/shared/lib/api-client';
import { OrderDto, OrderStatus, PaymentMethod } from '@/shared/types/api';
import { ArrowLeft, Clock, Truck, AlertCircle, RefreshCw } from 'lucide-react';
import * as signalR from '@microsoft/signalr';
import { StatusTimeline } from '@/features/tracking/components/StatusTimeline';
import { OrderMap } from '@/features/tracking/components/OrderMap';

const statusLabels: Record<OrderStatus, string> = {
  [OrderStatus.Created]: 'Pedido Registrado',
  [OrderStatus.PendingValidation]: 'Pendiente de Comprobante',
  [OrderStatus.Confirmed]: 'Confirmado / En Cola',
  [OrderStatus.InKitchen]: 'En Preparacion (Horno)',
  [OrderStatus.ReadyForDelivery]: 'Listo para Despacho',
  [OrderStatus.OnTheWay]: 'En Camino',
  [OrderStatus.Delivered]: 'Entregado',
  [OrderStatus.Cancelled]: 'Cancelado',
};

function OrderTrackingContent() {
  const params = useParams();
  const router = useRouter();
  const orderId = typeof params?.orderId === 'string' ? params.orderId : '';

  const [order, setOrder] = useState<OrderDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [driverLocation, setDriverLocation] = useState<{ latitude: number; longitude: number; heading?: number } | null>(null);

  useEffect(() => {
    let isSubscribed = true;

    const loadInitialOrder = async () => {
      if (!orderId) return;
      try {
        const data = await apiClient.getOrderById(orderId);
        if (isSubscribed) {
          setOrder(data);
          setError(null);
          setLoading(false);
        }
      } catch {
        if (isSubscribed) {
          setError('No se pudo cargar la orden especificada.');
          setLoading(false);
        }
      }
    };

    loadInitialOrder();

    // SignalR Tracking Hub
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/hubs/tracking`)
      .withAutomaticReconnect()
      .build();

    connection.start().then(() => {
      connection.invoke('JoinOrderTracking', orderId).catch(() => {});
    }).catch(() => {});

    connection.on('OrderStatusChanged', (payload: string | { orderId?: string; status: OrderStatus }) => {
      if (!isSubscribed) return;
      if (typeof payload === 'string') {
        const enumVal = OrderStatus[payload as keyof typeof OrderStatus];
        if (enumVal) {
          setOrder((prev) => (prev ? { ...prev, status: enumVal } : null));
        }
      } else if (payload && typeof payload === 'object' && payload.status) {
        setOrder((prev) => (prev ? { ...prev, status: payload.status } : null));
      }
    });

    connection.on('ReceiveDriverLocation', (latitude: number, longitude: number, heading?: number) => {
      if (isSubscribed) {
        setDriverLocation({ latitude, longitude, heading });
      }
    });

    connection.on('DriverLocationUpdated', (data: { orderId?: string; latitude: number; longitude: number; heading?: number }) => {
      if (isSubscribed && (!data.orderId || data.orderId === orderId)) {
        setDriverLocation({ latitude: data.latitude, longitude: data.longitude, heading: data.heading });
      }
    });

    const interval = setInterval(loadInitialOrder, 15000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
      connection.invoke('LeaveOrderTracking', orderId).catch(() => {});
      connection.stop().catch(() => {});
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-neutral-400">
        <RefreshCw className="h-8 w-8 animate-spin text-amber-500 mb-4" />
        <p className="text-sm">Cargando estado del pedido...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 bg-red-950/20 border border-red-800 rounded-lg text-center">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-white mb-2">Error al consultar el pedido</h2>
        <p className="text-sm text-neutral-400 mb-6">{error || 'La orden no existe o fue cancelada.'}</p>
        <button
          onClick={() => router.push('/')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-sm rounded font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a la carta
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button
        onClick={() => router.push('/')}
        className="inline-flex items-center gap-2 text-xs text-neutral-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a la tienda
      </button>

      {/* Cabecera del Pedido */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-neutral-800">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-500">
              {order.branchName}
            </span>
            <h1 className="text-xl font-bold text-white mt-1">Pedido #{order.orderId}</h1>
            <p className="text-xs text-neutral-400 mt-1">
              Cliente: {order.customerName} ({order.customerPhone})
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider ${
                order.status === OrderStatus.Cancelled
                  ? 'bg-red-950 text-red-400 border border-red-800'
                  : order.status === OrderStatus.Delivered
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-amber-950 text-amber-400 border border-amber-800'
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
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <Truck className="h-5 w-5 text-amber-500 animate-pulse" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
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

      {/* Detalle de Productos */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4 text-neutral-400" />
          Resumen de Articulos
        </h2>
        <div className="space-y-4 divide-y divide-neutral-800">
          {order.items.map((item) => (
            <div key={item.id} className="pt-3 first:pt-0 flex justify-between items-start text-sm">
              <div>
                <p className="text-white font-medium">
                  {item.quantity}x {item.productName}
                </p>
                {item.modifiers && item.modifiers.length > 0 && (
                  <ul className="text-xs text-neutral-400 mt-1 list-disc list-inside space-y-0.5">
                    {item.modifiers.map((m) => (
                      <li key={m.id}>
                        {m.modifierName} {m.price > 0 && `(+$${m.price.toFixed(2)})`}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <span className="font-mono text-white text-sm">${item.lineTotal.toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-neutral-800 mt-6 pt-4 space-y-1.5 text-xs text-neutral-400">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-mono text-white">${order.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Costo de Envio</span>
            <span className="font-mono text-white">${order.deliveryFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-neutral-800">
            <span>Total</span>
            <span className="font-mono text-amber-500">${order.total.toFixed(2)}</span>
          </div>
        </div>

        {order.paymentMethod === PaymentMethod.Cash && order.cashAmountPaid && (
          <div className="mt-4 p-3 bg-neutral-950 border border-neutral-800 rounded text-xs text-neutral-300">
            Paga con billete de: <strong className="text-white">${order.cashAmountPaid.toFixed(2)}</strong>.
            Vuelto a entregar: <strong className="text-amber-400">${(order.changeDue ?? 0).toFixed(2)}</strong>.
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrderTrackingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-neutral-400">
          <RefreshCw className="h-8 w-8 animate-spin text-amber-500 mb-4" />
          <p className="text-sm">Inicializando seguimiento...</p>
        </div>
      }
    >
      <OrderTrackingContent />
    </Suspense>
  );
}
