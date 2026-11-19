'use client';

import { useRouter } from 'next/navigation';
import {
  DollarSign,
  Clock,
  MapPin,
  ShieldCheck,
  CreditCard,
  AlertCircle,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '@/features/auth';
import { useTenantRoutes } from '@/shared/lib/tenant-routing';
import { DriverProfileResponse, DriverShiftSummaryDto, DriverOrderDto, PaymentMethod } from '@/shared/types/api';

interface ShiftSummaryTabProps {
  profile: DriverProfileResponse | null;
  shiftSummary: DriverShiftSummaryDto;
  deliveredToday: DriverOrderDto[];
}

export function ShiftSummaryTab({
  profile,
  shiftSummary,
  deliveredToday,
}: ShiftSummaryTabProps) {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const routes = useTenantRoutes();

  const handleLogout = async () => {
    await logout();
    router.push(routes.getLoginHref());
  };
  return (
    <div className="space-y-4 w-full">
      {/* Balance y Rendición del Turno (Formato limpio sin marcos ni cajas) */}
      <div className="space-y-1 pb-3 border-b border-surface-border text-xs">
        <div className="flex items-center justify-between py-1.5">
          <span className="text-text-muted">Entregas completadas hoy</span>
          <span className="font-mono font-bold text-text-strong">{shiftSummary.completedCount} pedidos</span>
        </div>
        <div className="flex items-center justify-between py-1.5">
          <span className="text-text-muted">Efectivo cobrado para rendir en caja</span>
          <span className="font-mono font-bold text-status-success">${shiftSummary.cashCollected.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between py-1.5">
          <span className="text-text-muted">Tarifa de flete acumulada</span>
          <span className="font-mono font-bold text-brand-accent">${shiftSummary.totalEarnings.toFixed(2)}</span>
        </div>
      </div>

      {/* Alerta de Liquidación de Efectivo */}
      {shiftSummary.cashCollected > 0 && (
        <div className="bg-surface-canvas border border-surface-border rounded-2xl p-3 sm:p-4 flex items-start gap-3 text-xs">
          <AlertCircle className="w-4 h-4 text-status-warning shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-text-strong">Liquidación de Caja Requerida</p>
            <p className="text-text-muted mt-0.5 leading-relaxed">
              Tienes <span className="font-mono font-bold text-status-success">${shiftSummary.cashCollected.toFixed(2)}</span> en efectivo recaudado. Entrega este valor al cajero de turno al finalizar la jornada.
            </p>
          </div>
        </div>
      )}

      {/* Historial de Entregas Realizadas Hoy */}
      <div className="border-0 sm:border sm:border-surface-border rounded-none sm:rounded-3xl bg-transparent sm:bg-surface-card p-0 sm:p-6 shadow-none sm:shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <h3 className="font-display font-black text-base sm:text-lg uppercase tracking-tight text-text-strong">
            Historial de Hoy ({deliveredToday.length})
          </h3>
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
            {new Date().toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })}
          </span>
        </div>

        {deliveredToday.length === 0 ? (
          <div className="py-6 sm:py-8 text-center text-text-muted text-xs">
            Aún no has completado pedidos en este turno.
          </div>
        ) : (
          <div className="space-y-3">
            {deliveredToday.map((order) => {
              const isCash = Number(order.paymentMethod) === PaymentMethod.Cash;
              const deliveryTime = order.deliveredAt
                ? new Date(order.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'Hoy';

              return (
                <div
                  key={order.orderId}
                  className="bg-surface-canvas border border-surface-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-text-strong">
                        #{order.orderNumber || order.orderId.slice(0, 8)}
                      </span>
                      <span className="text-text-muted">•</span>
                      <span className="text-text-muted flex items-center gap-1 font-mono text-[11px]">
                        <Clock className="w-3 h-3" />
                        {deliveryTime}
                      </span>
                    </div>
                    <p className="font-medium text-text-strong truncate">{order.customerName}</p>
                    <p className="text-text-muted text-[11px] truncate flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0 text-brand-primary" />
                      {order.addressStreet}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:flex-col sm:items-end gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-surface-border">
                    <span className="font-mono font-bold text-base text-text-strong">
                      ${order.total.toFixed(2)}
                    </span>
                    {isCash ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-status-warning/15 text-status-warning border border-status-warning/30 flex items-center gap-1">
                        <DollarSign className="w-2.5 h-2.5" />
                        Efectivo
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-status-info/15 text-status-info border border-status-info/30 flex items-center gap-1">
                        <CreditCard className="w-2.5 h-2.5" />
                        Digital
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Ficha del Repartidor y Vehículo */}
      {profile && (
        <div className="border-0 sm:border sm:border-surface-border rounded-none sm:rounded-2xl bg-transparent sm:bg-surface-card p-0 sm:p-5 shadow-none sm:shadow-xs space-y-3 text-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-surface-border">
            <ShieldCheck className="w-4 h-4 text-brand-primary" />
            <h4 className="font-bold text-text-strong uppercase tracking-wider text-[11px]">
              Ficha Operativa de Repartidor
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-text-muted">
            <div>
              <span className="text-[10px] block">Nombre Completo:</span>
              <span className="font-bold text-text-strong">{profile.fullName}</span>
            </div>
            <div>
              <span className="text-[10px] block">Vehículo Registrado:</span>
              <span className="font-bold text-text-strong">
                {profile.vehicleType} {profile.licensePlate ? `(${profile.licensePlate})` : ''}
              </span>
            </div>
            <div>
              <span className="text-[10px] block">Teléfono de Contacto:</span>
              <span className="font-mono font-bold text-text-strong">{profile.phone || 'Sin registrar'}</span>
            </div>
            <div>
              <span className="text-[10px] block">Sucursal de Asignación:</span>
              <span className="font-bold text-text-strong">{profile.branchName || 'Multisucursal'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Acción de Fin de Turno y Salida */}
      <button
        type="button"
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-full border border-surface-border bg-surface-card hover:bg-surface-card-hover text-text-muted hover:text-red-600 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
      >
        <LogOut className="w-4 h-4" />
        <span>Finalizar Turno y Cerrar Sesión</span>
      </button>
    </div>
  );
}
