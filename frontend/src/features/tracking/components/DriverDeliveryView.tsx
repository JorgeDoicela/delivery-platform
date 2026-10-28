'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiClient } from '@/shared/lib/api-client';
import { OrderDto, OrderStatus, PaymentMethod } from '@/shared/types/api';
import { useDriverTracking } from '../hooks/useDriverTracking';
import {
  MapPin,
  Phone,
  ExternalLink,
  CheckCircle,
  Radio,
  Navigation,
  RefreshCw,
  Search,
} from 'lucide-react';

export function DriverDeliveryView() {
  const searchParams = useSearchParams();
  const queryOrderId = searchParams.get('orderId') || '';

  const [orderIdInput, setOrderIdInput] = useState(queryOrderId);
  const [currentOrderId, setCurrentOrderId] = useState(queryOrderId);
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [isTrackingActive, setIsTrackingActive] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completedSuccess, setCompletedSuccess] = useState(false);

  useEffect(() => {
    let isSubscribed = true;

    const loadOrder = async () => {
      if (!currentOrderId) {
        setOrder(null);
        return;
      }
      setLoading(true);
      try {
        const data = await apiClient.getOrderById(currentOrderId);
        if (isSubscribed) {
          setOrder(data);
          setCompletedSuccess(data.status === OrderStatus.Delivered);
          setLoading(false);
        }
      } catch {
        if (isSubscribed) {
          setOrder(null);
          setLoading(false);
        }
      }
    };

    loadOrder();

    return () => {
      isSubscribed = false;
    };
  }, [currentOrderId]);

  const destinationLat = order?.deliveryLatitude ?? -0.1782;
  const destinationLng = order?.deliveryLongitude ?? -78.4845;

  const { currentPosition, lastSentAt, isSending, useSimulation, setUseSimulation } =
    useDriverTracking({
      orderId: currentOrderId,
      isActive: isTrackingActive && !completedSuccess && Boolean(currentOrderId),
      destinationLat,
      destinationLng,
    });

  const handleCompleteDelivery = async () => {
    if (!order) return;
    setIsCompleting(true);
    try {
      await apiClient.updateOrderStatus(order.orderId, OrderStatus.Delivered);
      setCompletedSuccess(true);
      setIsTrackingActive(false);
      setOrder((prev) => (prev ? { ...prev, status: OrderStatus.Delivered } : null));
    } catch {
      alert('Error al actualizar el estado de la entrega en el servidor.');
    } finally {
      setIsCompleting(false);
    }
  };

  const isCash = order?.paymentMethod === PaymentMethod.Cash;
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destinationLat},${destinationLng}`;
  const wazeUrl = `https://waze.com/ul?ll=${destinationLat},${destinationLng}&navigate=yes`;

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      {/* Selector Rápido de Orden para Repartidor */}
      <div className="bg-surface-dark-card border border-surface-dark-border rounded-xl p-3 flex items-center gap-2">
        <Search className="h-4 w-4 text-text-inverse-muted shrink-0" />
        <input
          type="text"
          value={orderIdInput}
          onChange={(e) => setOrderIdInput(e.target.value)}
          placeholder="Código UUID de la orden..."
          className="bg-transparent text-xs text-text-inverse-strong placeholder-text-inverse-subtle flex-1 focus:outline-none font-mono"
        />
        <button
          onClick={() => setCurrentOrderId(orderIdInput.trim())}
          className="px-3 py-1 bg-brand-accent hover:bg-brand-accent-hover text-surface-dark font-bold text-xs rounded transition-colors"
        >
          Cargar
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 text-text-inverse-muted">
          <RefreshCw className="h-6 w-6 animate-spin text-brand-accent mb-2" />
          <p className="text-xs">Cargando datos de la comanda...</p>
        </div>
      ) : order ? (
        <div className="bg-surface-dark border border-surface-dark-border rounded-2xl p-4 space-y-4 shadow-xl">
          {/* Cabecera de la Entrega */}
          <div className="flex items-center justify-between pb-3 border-b border-surface-dark-border">
            <div>
              <span className="text-[11px] font-bold text-brand-accent uppercase tracking-wider">
                {order.branchName}
              </span>
              <h2 className="text-lg font-black text-text-inverse-strong">Orden #{order.orderId}</h2>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                completedSuccess
                  ? 'bg-status-success/20 text-status-success border border-status-success/40'
                  : 'bg-status-warning/20 text-status-warning border border-status-warning/40'
              }`}
            >
              {completedSuccess ? 'Entregado' : 'En Reparto'}
            </span>
          </div>

          {/* Información del Cliente */}
          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-brand-accent shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-text-inverse-strong text-sm">{order.customerName}</p>
                <p className="text-text-inverse-base">{order.addressStreet}</p>
                {order.addressReference && (
                  <p className="text-text-inverse-subtle text-[11px]">Ref: {order.addressReference}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 text-text-inverse-base">
              <Phone className="w-3.5 h-3.5 text-text-inverse-muted" />
              <a
                href={`tel:${order.customerPhone}`}
                className="text-brand-accent font-semibold underline"
              >
                {order.customerPhone}
              </a>
            </div>
          </div>

          {/* Liquidación y Cobro */}
          <div className="bg-surface-dark-card border border-surface-dark-border rounded-xl p-3 flex justify-between items-center text-xs">
            <div>
              <p className="text-text-inverse-muted">Total a Cobrar:</p>
              <p className="text-base font-black text-text-inverse-strong font-mono">${order.total.toFixed(2)}</p>
            </div>
            {isCash && order.cashAmountPaid ? (
              <div className="text-right">
                <p className="text-text-inverse-muted">Paga con ${order.cashAmountPaid.toFixed(2)}</p>
                <p className="text-status-success font-bold font-mono">
                  Vuelto: ${(order.changeDue ?? 0).toFixed(2)}
                </p>
              </div>
            ) : (
              <div className="text-right">
                <p className="text-xs text-text-inverse-muted">Método de Pago:</p>
                <p className="text-xs font-bold text-brand-accent uppercase">
                  {order.paymentMethod === PaymentMethod.BankTransfer ? 'Transferencia' : 'Tarjeta'}
                </p>
              </div>
            )}
          </div>

          {/* Transmisor de Telemetría GPS */}
          <div className="bg-surface-dark-card/80 border border-surface-dark-border rounded-xl p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio
                  className={`w-4 h-4 ${
                    isTrackingActive && !completedSuccess
                      ? 'text-status-success animate-pulse'
                      : 'text-text-inverse-subtle'
                  }`}
                />
                <span className="text-xs font-bold text-text-inverse-strong">Transmisión GPS Satelital</span>
              </div>
              <button
                type="button"
                onClick={() => setIsTrackingActive(!isTrackingActive)}
                disabled={completedSuccess}
                className={`px-2.5 py-0.5 rounded text-[11px] font-bold border transition-colors ${
                  isTrackingActive && !completedSuccess
                    ? 'bg-status-success/20 text-status-success border-status-success/40'
                    : 'bg-surface-dark-hover text-text-inverse-muted border-surface-dark-border'
                }`}
              >
                {isTrackingActive && !completedSuccess ? 'ACTIVO' : 'PAUSADO'}
              </button>
            </div>

            <div className="text-[11px] font-mono text-text-inverse-muted flex items-center justify-between">
              <span>
                Lat: {currentPosition.latitude.toFixed(5)}, Lng:{' '}
                {currentPosition.longitude.toFixed(5)}
              </span>
              {isSending && <span className="text-brand-accent text-[10px]">Enviando...</span>}
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-surface-dark-border/60 text-[11px]">
              <label className="flex items-center gap-1.5 text-text-inverse-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={useSimulation}
                  onChange={(e) => setUseSimulation(e.target.checked)}
                  className="rounded border-surface-dark-border bg-surface-dark text-brand-accent focus:ring-0"
                />
                Simular ruta a destino
              </label>
              {lastSentAt && (
                <span className="text-text-inverse-subtle text-[10px]">
                  Último ping: {lastSentAt.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>

          {/* Deep Links a Navegadores GPS Externos */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 bg-status-info hover:bg-status-info/80 text-text-inverse-strong font-bold py-3 rounded-xl text-xs transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Google Maps</span>
            </a>

            <a
              href={wazeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 bg-brand-accent hover:bg-brand-accent-hover text-surface-dark font-bold py-3 rounded-xl text-xs transition-colors"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Waze</span>
            </a>
          </div>

          {/* Botón de Confirmación de Entrega */}
          {!completedSuccess ? (
            <button
              type="button"
              onClick={handleCompleteDelivery}
              disabled={isCompleting}
              className="w-full flex items-center justify-center gap-2 bg-status-success hover:bg-status-success/90 text-text-inverse-strong font-extrabold py-3.5 rounded-xl text-sm transition-all active:scale-95 disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isCompleting ? 'Procesando entrega...' : 'Confirmar Entrega y Cobro'}</span>
            </button>
          ) : (
            <div className="p-3 bg-status-success/20 border border-status-success/40 rounded-xl text-center text-xs text-status-success font-bold">
              Pedido entregado exitosamente.
            </div>
          )}
        </div>
      ) : (
        <div className="bg-surface-dark-card border border-surface-dark-border rounded-xl p-8 text-center text-text-inverse-muted text-xs">
          {currentOrderId
            ? `No se encontró la orden #${currentOrderId}. Ingresa un código UUID válido.`
            : 'Ingresa un código UUID de orden asignada para comenzar la hoja de ruta.'}
        </div>
      )}
    </div>
  );
}

