"use client";

import { useState, useEffect } from 'react';
import { apiClient } from '@/shared/lib/api-client';
import { OrderDto, OrderStatus, PaymentMethod } from '@/shared/types/api';
import { useDriverTracking } from '../hooks/useDriverTracking';
import {
  MapPin,
  Phone,
  Navigation,
  ExternalLink,
  CheckCircle,
  Radio,
  Search,
  RefreshCw,
} from 'lucide-react';

interface DriverDeliveryViewProps {
  initialOrderId?: string;
}

export function DriverDeliveryView({ initialOrderId }: DriverDeliveryViewProps) {
  const [currentOrderId, setCurrentOrderId] = useState<string>(initialOrderId || '');
  const [orderIdInput, setOrderIdInput] = useState<string>(initialOrderId || '');
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [isTrackingActive, setIsTrackingActive] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completedSuccess, setCompletedSuccess] = useState(false);

  // Hook de Telemetría GPS en tiempo real
  const destinationLat = order?.deliveryLatitude ?? -0.3323;
  const destinationLng = order?.deliveryLongitude ?? -78.5571;

  const {
    currentPosition,
    lastSentAt,
    isSending,
    useSimulation,
    setUseSimulation,
  } = useDriverTracking({
    orderId: currentOrderId,
    isActive: isTrackingActive && !completedSuccess && Boolean(currentOrderId),
    destinationLat,
    destinationLng,
  });

  // Carga reactiva de los detalles del pedido asignado
  useEffect(() => {
    let isMounted = true;
    if (!currentOrderId) {
      return () => {
        isMounted = false;
      };
    }

    apiClient
      .getOrderById(currentOrderId)
      .then((data: OrderDto) => {
        if (isMounted) {
          setOrder(data);
          setCompletedSuccess(data.status === OrderStatus.Delivered);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setOrder(null);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [currentOrderId]);

  const handleCompleteDelivery = async () => {
    if (!currentOrderId) return;
    setIsCompleting(true);
    try {
      await apiClient.updateOrderStatus(currentOrderId, OrderStatus.Delivered);
      setIsTrackingActive(false);
      setCompletedSuccess(true);
    } finally {
      setIsCompleting(false);
    }
  };

  const isCash = order?.paymentMethod === PaymentMethod.Cash;
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destinationLat},${destinationLng}`;
  const wazeUrl = `https://waze.com/ul?ll=${destinationLat},${destinationLng}&navigate=yes`;

  return (
    <div className="space-y-4 w-full">
      {/* Selector Rápido de Orden para Repartidor */}
      <div className="bg-surface-card border border-surface-border rounded-full p-2 pl-4 flex items-center gap-2 shadow-xs">
        <Search className="h-4 w-4 text-text-muted shrink-0" />
        <input
          type="text"
          value={orderIdInput}
          onChange={(e) => setOrderIdInput(e.target.value)}
          placeholder="Código UUID de la orden..."
          className="bg-transparent text-xs text-text-strong placeholder:text-text-muted flex-1 focus:outline-none font-mono"
        />
        <button
          onClick={() => {
            const nextId = orderIdInput.trim();
            setCurrentOrderId(nextId);
            if (nextId) setLoading(true);
            else setOrder(null);
          }}
          className="px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold text-xs uppercase tracking-wider rounded-full transition-all active:scale-95 shadow-sm cursor-pointer"
        >
          Cargar
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 text-text-muted">
          <RefreshCw className="h-6 w-6 animate-spin text-brand-primary mb-2" />
          <p className="text-xs">Cargando datos de la comanda...</p>
        </div>
      ) : order ? (
        <div className="bg-surface-card border border-surface-border rounded-3xl p-6 space-y-5 shadow-xs transition-colors duration-200">
          {/* Cabecera de la Entrega */}
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <div>
              <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider">
                {order.branchName}
              </span>
              <h2 className="text-xl font-black uppercase tracking-tight text-text-strong font-display mt-0.5">
                Orden #{order.orderId.slice(0, 8)}
              </h2>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                completedSuccess
                  ? 'bg-status-success/20 text-status-success border border-status-success/40'
                  : 'bg-brand-primary text-white border border-brand-primary-hover shadow-sm'
              }`}
            >
              {completedSuccess ? 'Entregado' : 'En Reparto'}
            </span>
          </div>

          {/* Información del Cliente */}
          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-text-strong text-sm">{order.customerName}</p>
                <p className="text-text-base mt-0.5">{order.addressStreet}</p>
                {order.addressReference && (
                  <p className="text-text-muted text-[11px] mt-0.5">Ref: {order.addressReference}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 text-text-base">
              <Phone className="w-3.5 h-3.5 text-text-muted" />
              <a
                href={`tel:${order.customerPhone}`}
                className="text-brand-primary font-bold underline"
              >
                {order.customerPhone}
              </a>
            </div>
          </div>

          {/* Liquidación y Cobro */}
          <div className="bg-surface-canvas border border-surface-border rounded-2xl p-4 flex justify-between items-center text-xs">
            <div>
              <p className="text-text-muted text-[11px]">Total a Cobrar:</p>
              <p className="text-lg font-black text-brand-primary font-mono tabular-nums">${order.total.toFixed(2)}</p>
            </div>
            {isCash && order.cashAmountPaid ? (
              <div className="text-right">
                <p className="text-text-muted text-[11px]">Paga con ${order.cashAmountPaid.toFixed(2)}</p>
                <p className="text-status-success font-bold font-mono tabular-nums">
                  Vuelto: ${(order.changeDue ?? 0).toFixed(2)}
                </p>
              </div>
            ) : (
              <div className="text-right">
                <p className="text-[11px] text-text-muted">Método de Pago:</p>
                <p className="text-xs font-bold text-text-strong uppercase tracking-wider">
                  {order.paymentMethod === PaymentMethod.BankTransfer ? 'Transferencia' : 'Tarjeta'}
                </p>
              </div>
            )}
          </div>

          {/* Transmisor de Telemetría GPS */}
          <div className="bg-surface-canvas border border-surface-border rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio
                  className={`w-4 h-4 ${
                    isTrackingActive && !completedSuccess
                      ? 'text-status-success animate-pulse'
                      : 'text-text-muted'
                  }`}
                />
                <span className="text-xs font-bold text-text-strong uppercase tracking-wider">Transmisión GPS Satelital</span>
              </div>
              <button
                type="button"
                onClick={() => setIsTrackingActive(!isTrackingActive)}
                disabled={completedSuccess}
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-colors cursor-pointer ${
                  isTrackingActive && !completedSuccess
                    ? 'bg-status-success/20 text-status-success border-status-success/40'
                    : 'bg-surface-card text-text-muted border-surface-border'
                }`}
              >
                {isTrackingActive && !completedSuccess ? 'ACTIVO' : 'PAUSADO'}
              </button>
            </div>

            <div className="text-[11px] font-mono text-text-muted flex items-center justify-between">
              <span>
                Lat: {currentPosition.latitude.toFixed(5)}, Lng:{' '}
                {currentPosition.longitude.toFixed(5)}
              </span>
              {isSending && <span className="text-brand-primary font-bold text-[10px]">Transmitiendo...</span>}
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-surface-border text-[11px]">
              <label className="flex items-center gap-1.5 text-text-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={useSimulation}
                  onChange={(e) => setUseSimulation(e.target.checked)}
                  className="rounded border-surface-border bg-surface-canvas text-brand-primary focus:ring-0"
                />
                Simular ruta a destino
              </label>
              {lastSentAt && (
                <span className="text-text-muted text-[10px] font-mono">
                  Ping: {lastSentAt.toLocaleTimeString()}
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
              className="flex items-center justify-center gap-1.5 bg-surface-canvas hover:bg-surface-card-hover text-text-strong font-bold uppercase tracking-wider py-3 px-4 rounded-full text-xs transition-colors border border-surface-border"
            >
              <ExternalLink className="w-3.5 h-3.5 text-sky-500" />
              <span>Google Maps</span>
            </a>

            <a
              href={wazeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 bg-surface-canvas hover:bg-surface-card-hover text-text-strong font-bold uppercase tracking-wider py-3 px-4 rounded-full text-xs transition-colors border border-surface-border"
            >
              <Navigation className="w-3.5 h-3.5 text-cyan-500" />
              <span>Waze</span>
            </a>
          </div>

          {/* Botón de Confirmación de Entrega */}
          {!completedSuccess ? (
            <button
              type="button"
              onClick={handleCompleteDelivery}
              disabled={isCompleting}
              className="w-full flex items-center justify-center gap-2 bg-status-success hover:bg-status-success/90 text-white font-black uppercase tracking-wider py-4 px-6 rounded-full text-xs shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isCompleting ? 'Procesando entrega...' : 'Confirmar Entrega y Cobro'}</span>
            </button>
          ) : (
            <div className="p-3 bg-status-success/20 border border-status-success/40 rounded-full text-center text-xs text-status-success font-bold uppercase tracking-wider">
              Pedido entregado exitosamente.
            </div>
          )}
        </div>
      ) : (
        <div className="bg-surface-card border border-surface-border rounded-3xl p-8 text-center text-text-muted text-xs leading-relaxed shadow-xs">
          {currentOrderId
            ? `No se encontró la orden #${currentOrderId}. Ingresa un código UUID válido.`
            : 'Ingresa un código UUID de orden asignada para comenzar la hoja de ruta.'}
        </div>
      )}
    </div>
  );
}
