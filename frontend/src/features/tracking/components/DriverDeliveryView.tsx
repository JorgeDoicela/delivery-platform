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
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 flex items-center gap-2">
        <Search className="h-4 w-4 text-neutral-400 shrink-0" />
        <input
          type="text"
          value={orderIdInput}
          onChange={(e) => setOrderIdInput(e.target.value)}
          placeholder="Código UUID de la orden..."
          className="bg-transparent text-xs text-white placeholder-neutral-500 flex-1 focus:outline-none font-mono"
        />
        <button
          onClick={() => setCurrentOrderId(orderIdInput.trim())}
          className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded transition-colors"
        >
          Cargar
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 text-neutral-400">
          <RefreshCw className="h-6 w-6 animate-spin text-amber-500 mb-2" />
          <p className="text-xs">Cargando datos de la comanda...</p>
        </div>
      ) : order ? (
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 space-y-4 shadow-xl">
          {/* Cabecera de la Entrega */}
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div>
              <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider">
                {order.branchName}
              </span>
              <h2 className="text-lg font-black text-white">Orden #{order.orderId}</h2>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                completedSuccess
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-amber-950 text-amber-400 border border-amber-800'
              }`}
            >
              {completedSuccess ? 'Entregado' : 'En Reparto'}
            </span>
          </div>

          {/* Información del Cliente */}
          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white text-sm">{order.customerName}</p>
                <p className="text-neutral-300">{order.addressStreet}</p>
                {order.addressReference && (
                  <p className="text-neutral-500 text-[11px]">Ref: {order.addressReference}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 text-neutral-300">
              <Phone className="w-3.5 h-3.5 text-neutral-400" />
              <a
                href={`tel:${order.customerPhone}`}
                className="text-amber-400 font-semibold underline"
              >
                {order.customerPhone}
              </a>
            </div>
          </div>

          {/* Liquidación y Cobro */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 flex justify-between items-center text-xs">
            <div>
              <p className="text-neutral-400">Total a Cobrar:</p>
              <p className="text-base font-black text-white font-mono">${order.total.toFixed(2)}</p>
            </div>
            {isCash && order.cashAmountPaid ? (
              <div className="text-right">
                <p className="text-neutral-400">Paga con ${order.cashAmountPaid.toFixed(2)}</p>
                <p className="text-emerald-400 font-bold font-mono">
                  Vuelto: ${(order.changeDue ?? 0).toFixed(2)}
                </p>
              </div>
            ) : (
              <div className="text-right">
                <p className="text-xs text-neutral-400">Método de Pago:</p>
                <p className="text-xs font-bold text-amber-400 uppercase">
                  {order.paymentMethod === PaymentMethod.BankTransfer ? 'Transferencia' : 'Tarjeta'}
                </p>
              </div>
            )}
          </div>

          {/* Transmisor de Telemetría GPS */}
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio
                  className={`w-4 h-4 ${
                    isTrackingActive && !completedSuccess
                      ? 'text-emerald-400 animate-pulse'
                      : 'text-neutral-600'
                  }`}
                />
                <span className="text-xs font-bold text-white">Transmisión GPS Satelital</span>
              </div>
              <button
                type="button"
                onClick={() => setIsTrackingActive(!isTrackingActive)}
                disabled={completedSuccess}
                className={`px-2.5 py-0.5 rounded text-[11px] font-bold border transition-colors ${
                  isTrackingActive && !completedSuccess
                    ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                    : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                }`}
              >
                {isTrackingActive && !completedSuccess ? 'ACTIVO' : 'PAUSADO'}
              </button>
            </div>

            <div className="text-[11px] font-mono text-neutral-400 flex items-center justify-between">
              <span>
                Lat: {currentPosition.latitude.toFixed(5)}, Lng:{' '}
                {currentPosition.longitude.toFixed(5)}
              </span>
              {isSending && <span className="text-amber-400 text-[10px]">Enviando...</span>}
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-neutral-800/60 text-[11px]">
              <label className="flex items-center gap-1.5 text-neutral-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useSimulation}
                  onChange={(e) => setUseSimulation(e.target.checked)}
                  className="rounded border-neutral-700 bg-neutral-950 text-amber-500 focus:ring-0"
                />
                Simular ruta a destino
              </label>
              {lastSentAt && (
                <span className="text-neutral-500 text-[10px]">
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
              className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-xs transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Google Maps</span>
            </a>

            <a
              href={wazeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl text-xs transition-colors"
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
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3.5 rounded-xl text-sm transition-all active:scale-95 disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isCompleting ? 'Procesando entrega...' : 'Confirmar Entrega y Cobro'}</span>
            </button>
          ) : (
            <div className="p-3 bg-emerald-950/40 border border-emerald-800 rounded-xl text-center text-xs text-emerald-400 font-bold">
              Pedido entregado exitosamente.
            </div>
          )}
        </div>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center text-neutral-400 text-xs">
          {currentOrderId
            ? `No se encontró la orden #${currentOrderId}. Ingresa un código UUID válido.`
            : 'Ingresa un código UUID de orden asignada para comenzar la hoja de ruta.'}
        </div>
      )}
    </div>
  );
}

