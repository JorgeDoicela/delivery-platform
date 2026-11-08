'use client';

import { useState } from 'react';
import {
  MapPin,
  Phone,
  ExternalLink,
  Navigation,
  CheckCircle,
  Radio,
  Clock,
  DollarSign,
  PackageCheck,
  CreditCard,
  FileText,
} from 'lucide-react';
import { DriverOrderDto, PaymentMethod } from '@/shared/types/api';
import { useDriverTracking } from '../hooks/useDriverTracking';
import { OrderMap } from './OrderMap';

interface ActiveDeliveryTabProps {
  activeOrders: DriverOrderDto[];
  selectedOrderId: string | null;
  onSelectOrder: (orderId: string) => void;
  onCompleteDelivery: (orderId: string) => Promise<boolean>;
  onGoToAvailable: () => void;
  driverId?: string;
}

export function ActiveDeliveryTab({
  activeOrders,
  selectedOrderId,
  onSelectOrder,
  onCompleteDelivery,
  onGoToAvailable,
  driverId,
}: ActiveDeliveryTabProps) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [isSuccessFeedback, setIsSuccessFeedback] = useState(false);
  const [isTrackingActive, setIsTrackingActive] = useState(true);

  const currentOrder =
    activeOrders.find((o) => o.orderId === selectedOrderId) || activeOrders[0] || null;

  const destinationLat = currentOrder?.deliveryLatitude ?? -0.3323;
  const destinationLng = currentOrder?.deliveryLongitude ?? -78.5571;

  const {
    currentPosition,
    lastSentAt,
    isSending,
    useSimulation,
    setUseSimulation,
  } = useDriverTracking({
    orderId: currentOrder?.orderId || '',
    driverId,
    isActive: isTrackingActive && Boolean(currentOrder),
    destinationLat,
    destinationLng,
  });

  const handleComplete = async () => {
    if (!currentOrder) return;
    setIsCompleting(true);
    try {
      const ok = await onCompleteDelivery(currentOrder.orderId);
      if (ok) {
        setIsSuccessFeedback(true);
        setTimeout(() => setIsSuccessFeedback(false), 3000);
      }
    } finally {
      setIsCompleting(false);
    }
  };

  if (!currentOrder || activeOrders.length === 0) {
    return (
      <div className="bg-surface-card border border-surface-border rounded-3xl p-8 sm:p-12 text-center shadow-xs space-y-5 my-2">
        <div className="w-16 h-16 rounded-full bg-surface-canvas border border-surface-border mx-auto flex items-center justify-center text-text-muted">
          <PackageCheck className="w-8 h-8" />
        </div>
        <div>
          <h3 className="font-display font-black text-xl uppercase tracking-tight text-text-strong">
            Sin Entregas en Curso
          </h3>
          <p className="text-xs text-text-muted max-w-sm mx-auto mt-1.5 leading-relaxed">
            Actualmente no tienes ningún pedido asignado en ruta. Revisa las comandas listas en cocina para iniciar un reparto.
          </p>
        </div>
        <button
          type="button"
          onClick={onGoToAvailable}
          className="px-6 py-3.5 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold uppercase tracking-wider rounded-full transition-all active:scale-95 shadow-md cursor-pointer inline-flex items-center justify-center min-h-[44px]"
        >
          Explorar Comandas Listas en Cocina
        </button>
      </div>
    );
  }

  const isCash = Number(currentOrder.paymentMethod) === PaymentMethod.Cash;
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destinationLat},${destinationLng}`;
  const wazeUrl = `https://waze.com/ul?ll=${destinationLat},${destinationLng}&navigate=yes`;

  return (
    <div className="space-y-4 w-full">
      {/* Selector de Órdenes Múltiples si el motorizado lleva más de una */}
      {activeOrders.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted shrink-0 pl-1">
            Rutas Activas:
          </span>
          {activeOrders.map((o) => {
            const isSelected = o.orderId === currentOrder.orderId;
            return (
              <button
                key={o.orderId}
                type="button"
                onClick={() => onSelectOrder(o.orderId)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shrink-0 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-brand-primary text-white shadow-xs'
                    : 'bg-surface-card hover:bg-surface-card-hover border border-surface-border text-text-strong'
                }`}
              >
                #{o.orderNumber || o.orderId.slice(0, 6)} • {o.customerName.split(' ')[0]}
              </button>
            );
          })}
        </div>
      )}

      {/* Tarjeta Principal de la Entrega */}
      <div className="bg-surface-card border border-surface-border rounded-3xl p-5 sm:p-6 space-y-5 shadow-xs transition-colors duration-200">
        {/* Cabecera de la Orden */}
        <div className="flex items-center justify-between pb-3.5 border-b border-surface-border">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider">
                {currentOrder.branchName}
              </span>
              <span className="text-text-muted text-[10px]">•</span>
              <span className="text-[10px] font-mono text-text-muted flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(currentOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-text-strong font-display mt-0.5">
              Orden #{currentOrder.orderNumber || currentOrder.orderId.slice(0, 8)}
            </h2>
          </div>
          <span className="px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-primary text-white shadow-xs">
            En Ruta
          </span>
        </div>

        {/* Datos del Cliente y Destino */}
        <div className="space-y-3 bg-surface-canvas border border-surface-border rounded-2xl p-4 text-xs">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="font-bold text-text-strong text-sm truncate">{currentOrder.customerName}</p>
              <p className="text-text-base mt-0.5 leading-relaxed">{currentOrder.addressStreet}</p>
              {currentOrder.addressReference && (
                <p className="text-text-muted text-[11px] mt-1 bg-surface-card px-2.5 py-1 rounded-lg border border-surface-border inline-block">
                  Ref: {currentOrder.addressReference}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-surface-border">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-brand-primary shrink-0" />
              <a
                href={`tel:${currentOrder.customerPhone}`}
                className="font-mono font-bold text-text-strong text-xs hover:text-brand-primary transition-colors underline"
              >
                {currentOrder.customerPhone}
              </a>
            </div>
            <a
              href={`tel:${currentOrder.customerPhone}`}
              className="px-3 py-1 bg-surface-card hover:bg-surface-card-hover border border-surface-border text-brand-primary font-bold text-[10px] uppercase tracking-wider rounded-full transition-colors"
            >
              Llamar Cliente
            </a>
          </div>

          {currentOrder.customerNotes && (
            <div className="pt-2 border-t border-surface-border flex items-start gap-2 text-text-muted text-[11px]">
              <FileText className="w-3.5 h-3.5 text-brand-accent shrink-0 mt-0.5" />
              <p className="italic">{currentOrder.customerNotes}</p>
            </div>
          )}
        </div>

        {/* Resumen de Productos de la Comanda */}
        {currentOrder.items && currentOrder.items.length > 0 && (
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
              Contenido de la comanda ({currentOrder.items.reduce((acc, i) => acc + i.quantity, 0)} artículos):
            </span>
            <div className="bg-surface-canvas border border-surface-border rounded-2xl p-3.5 space-y-1.5 text-xs">
              {currentOrder.items.map((item, idx) => (
                <div key={idx} className="flex items-baseline justify-between gap-2">
                  <div className="min-w-0">
                    <span className="font-mono font-bold text-brand-primary mr-1.5">
                      {item.quantity}x
                    </span>
                    <span className="font-medium text-text-strong">{item.productName}</span>
                    {item.modifiers && item.modifiers.length > 0 && (
                      <p className="text-[10px] text-text-muted pl-5 truncate">
                        {item.modifiers.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Módulo de Cobro y Liquidación */}
        <div className="bg-surface-canvas border border-surface-border rounded-2xl p-4 text-xs space-y-2.5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-text-muted text-[11px]">Total a Cobrar:</p>
              <p className="text-2xl font-black text-brand-primary font-mono tabular-nums leading-none mt-0.5">
                ${currentOrder.total.toFixed(2)}
              </p>
            </div>

            {isCash ? (
              <div className="text-right">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-status-warning/15 text-status-warning border border-status-warning/30 inline-flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  Cobro en Efectivo
                </span>
                {currentOrder.cashAmountPaid ? (
                  <div className="mt-1">
                    <p className="text-text-muted text-[11px]">Paga con ${currentOrder.cashAmountPaid.toFixed(2)}</p>
                    <p className="text-status-success font-bold font-mono tabular-nums text-sm">
                      Vuelto: ${(currentOrder.changeDue ?? 0).toFixed(2)}
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-text-muted mt-1">Cobro exacto</p>
                )}
              </div>
            ) : (
              <div className="text-right">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-status-info/15 text-status-info border border-status-info/30 inline-flex items-center gap-1">
                  <CreditCard className="w-3 h-3" />
                  Pagado Digitalmente
                </span>
                <p className="text-[11px] text-text-muted mt-1">No cobrar al cliente</p>
              </div>
            )}
          </div>
        </div>

        {/* Transmisor de Telemetría GPS */}
        <div className="bg-surface-canvas border border-surface-border rounded-2xl p-4 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio
                className={`w-4 h-4 ${
                  isTrackingActive ? 'text-status-success animate-pulse' : 'text-text-muted'
                }`}
              />
              <span className="font-bold text-text-strong uppercase tracking-wider text-[11px]">
                Transmisión Satelital GPS
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsTrackingActive(!isTrackingActive)}
              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-colors cursor-pointer ${
                isTrackingActive
                  ? 'bg-status-success/20 text-status-success border-status-success/40'
                  : 'bg-surface-card text-text-muted border-surface-border'
              }`}
            >
              {isTrackingActive ? 'Activo' : 'Pausado'}
            </button>
          </div>

          <div className="text-[11px] font-mono text-text-muted flex items-center justify-between">
            <span>
              Lat: {currentPosition.latitude.toFixed(5)}, Lng: {currentPosition.longitude.toFixed(5)}
            </span>
            {isSending && <span className="text-brand-primary font-bold text-[10px]">Enviando ping...</span>}
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-surface-border text-[11px]">
            <label className="flex items-center gap-1.5 text-text-muted cursor-pointer">
              <input
                type="checkbox"
                checked={useSimulation}
                onChange={(e) => setUseSimulation(e.target.checked)}
                className="rounded border-surface-border bg-surface-canvas text-brand-primary focus:ring-0"
              />
              Simular desplazamiento
            </label>
            {lastSentAt && (
              <span className="text-text-muted text-[10px] font-mono">
                Último: {lastSentAt.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* Mapa de Ruta con MapLibre */}
        <div className="overflow-hidden rounded-2xl border border-surface-border h-48 sm:h-56">
          <OrderMap
            destination={{ latitude: destinationLat, longitude: destinationLng }}
            driverLocation={currentPosition}
            className="w-full h-full"
          />
        </div>

        {/* Navegación Externa en GPS */}
        <div className="grid grid-cols-2 gap-3">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-surface-canvas hover:bg-surface-card-hover text-text-strong font-bold uppercase tracking-wider py-3.5 px-4 rounded-full text-xs transition-colors border border-surface-border"
          >
            <ExternalLink className="w-4 h-4 text-sky-500" />
            <span>Google Maps</span>
          </a>

          <a
            href={wazeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-surface-canvas hover:bg-surface-card-hover text-text-strong font-bold uppercase tracking-wider py-3.5 px-4 rounded-full text-xs transition-colors border border-surface-border"
          >
            <Navigation className="w-4 h-4 text-cyan-500" />
            <span>Waze</span>
          </a>
        </div>

        {/* Botón de Confirmación de Entrega */}
        {isSuccessFeedback ? (
          <div className="p-4 bg-status-success/20 border border-status-success/40 rounded-full text-center text-xs text-status-success font-bold uppercase tracking-wider flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>Entrega liquidada con éxito</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleComplete}
            disabled={isCompleting}
            className="w-full flex items-center justify-center gap-2 bg-status-success hover:bg-status-success/90 text-white font-black uppercase tracking-wider py-4 px-6 rounded-full text-xs shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <CheckCircle className="w-4 h-4" />
            <span>{isCompleting ? 'Procesando entrega...' : 'Confirmar Entrega y Cobro Realizado'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
