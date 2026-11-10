"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/features/auth";
import { useAccountStore } from "@/features/account";
import { useTenantRoutes } from "@/shared/lib/tenant-routing";
import { formatCurrency, formatDate } from "@/shared/lib/utils";
import {
  MapPin,
  ArrowRight,
  Truck,
  Clock,
  LogIn,
  UserPlus,
  RefreshCw,
  ShoppingBag,
  ExternalLink,
  Phone,
} from "lucide-react";

export function OrderSearchView() {
  const router = useRouter();
  const routes = useTenantRoutes();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  const orders = useAccountStore((s) => s.orders);
  const loadingOrders = useAccountStore((s) => s.isLoadingOrders);
  const fetchOrders = useAccountStore((s) => s.fetchOrders);

  useEffect(() => {
    if (isAuthenticated) {
      void fetchOrders();
    }
  }, [isAuthenticated, fetchOrders]);

  const activeOrders = orders.filter((o) => o.isActive);

  return (
    <div className="w-full max-w-4xl mx-auto py-8 sm:py-12 space-y-10">
      {/* Cabecera Principal */}
      <div className="text-center space-y-3">
        <div className="w-14 h-14 bg-brand-primary text-white rounded-2xl mx-auto flex items-center justify-center mb-2 shadow-md">
          <Truck className="w-7 h-7" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-text-strong uppercase tracking-wide font-display">
          Rastreo de Pedidos en Vivo
        </h1>
        <p className="text-xs sm:text-sm text-text-muted max-w-xl mx-auto leading-relaxed">
          Consulta en tiempo real el avance de tu comanda en horno, empaque en mostrador y telemetría satelital del repartidor.
        </p>
      </div>

      {/* Caso 1: Usuario Autenticado -> Pedidos Activos Vinculados a su Cuenta / Teléfono */}
      {isAuthenticated ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-border">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-text-strong font-display flex items-center gap-2">
                <span>Tus Pedidos en Curso</span>
                {activeOrders.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-brand-primary text-white text-[11px] font-mono">
                    {activeOrders.length}
                  </span>
                )}
              </h2>
              <p className="text-xs text-text-muted mt-0.5 flex flex-wrap items-center gap-2">
                <span>
                  Conectado como <strong className="text-text-strong">{user?.fullName || user?.email}</strong>
                </span>
                {user?.phone && (
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-full">
                    <Phone className="w-3 h-3" />
                    <span>{user.phone}</span>
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={() => void fetchOrders()}
              disabled={loadingOrders}
              className="inline-flex items-center self-start sm:self-auto gap-1.5 text-xs text-text-muted hover:text-brand-primary transition-colors cursor-pointer py-1.5 px-3 rounded-full border border-surface-border hover:border-brand-primary/40 bg-surface-card"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? "animate-spin text-brand-primary" : ""}`} />
              <span>Actualizar Pedidos</span>
            </button>
          </div>

          {loadingOrders && orders.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-text-muted gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-brand-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Sincronizando tus pedidos con tu cuenta...
              </span>
            </div>
          ) : activeOrders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeOrders.map((order) => (
                <div
                  key={order.orderId}
                  className="bg-surface-card border border-surface-border rounded-3xl p-5 shadow-sm hover:border-brand-primary/40 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-brand-primary font-display block">
                          {order.branchName || order.tenantName}
                        </span>
                        <h3 className="text-xl font-black uppercase tracking-tight text-text-strong font-display">
                          Pedido #{order.orderNumber > 0 ? order.orderNumber : order.orderId.slice(0, 8)}
                        </h3>
                      </div>
                      <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-brand-primary/10 text-brand-primary border border-brand-primary/20 shrink-0">
                        {order.statusText}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-text-muted pt-2 border-t border-surface-border-subtle">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-text-subtle shrink-0" />
                        <span>Registrado: {formatDate(order.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-text-subtle shrink-0" />
                        <span className="truncate">{order.addressStreet}</span>
                      </div>
                    </div>

                    {order.items && order.items.length > 0 && (
                      <div className="bg-surface-canvas p-3 rounded-2xl text-xs space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-text-subtle block font-display">
                          Artículos ({order.items?.length || 0})
                        </span>
                        <p className="text-text-strong font-medium truncate">
                          {order.items.map((i) => `${i.quantity}x ${i.productName}`).join(", ")}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-surface-border-subtle flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-text-muted block">Total</span>
                      <span className="font-mono text-base font-black text-text-strong tabular-nums">
                        {formatCurrency(order.total)}
                      </span>
                    </div>
                    <button
                      onClick={() => router.push(routes.getRastreoHref(order.orderId))}
                      className="inline-flex items-center gap-2 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-black uppercase tracking-wider py-2.5 px-5 rounded-full shadow-md transition-all active:scale-95 cursor-pointer font-display"
                    >
                      <span>Rastrear en Vivo</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-surface-card border border-surface-border text-center space-y-3">
              <ShoppingBag className="w-10 h-10 text-text-muted mx-auto" />
              <h3 className="text-base font-bold uppercase tracking-wider text-text-strong font-display">
                No tienes pedidos en preparación
              </h3>
              <p className="text-xs text-text-muted max-w-md mx-auto leading-relaxed">
                Todos tus pedidos anteriores ya fueron entregados. Al realizar una nueva orden en tienda, por aplicación o vía WhatsApp con tu número de teléfono registrado, aparecerá aquí automáticamente.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={() => router.push(routes.getHomeHref())}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs uppercase tracking-wider rounded-full font-black shadow-md transition-all cursor-pointer font-display"
                >
                  <span>Ver Menú del Restaurante</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => router.push(routes.getAccountHref())}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-surface-card hover:bg-surface-card-hover border border-surface-border text-text-strong text-xs uppercase tracking-wider rounded-full font-bold transition-all cursor-pointer font-display"
                >
                  <span>Historial de Compras</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Caso 2: Usuario NO Autenticado -> Acceso Directo Vinculado a Cuenta y Teléfono */
        <div className="bg-surface-card border border-surface-border rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <span className="text-[10px] font-black uppercase tracking-wider text-brand-primary font-display block">
                Vinculación Automática
              </span>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-text-strong font-display">
                Tus Pedidos Asociados a Tu Cuenta y Teléfono
              </h2>
              <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                Todos los pedidos solicitados por la web o vía WhatsApp quedan automáticamente sincronizados a tu número de teléfono y correo. Inicia sesión para rastrear tu orden en tiempo real sin requerir códigos manuales ni identificadores UUID.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
              <button
                onClick={() => router.push(`${routes.getLoginHref()}?redirect=/rastreo`)}
                className="inline-flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-primary-hover text-white font-black text-xs uppercase tracking-wider py-3.5 px-6 rounded-full shadow-md transition-all active:scale-95 cursor-pointer font-display"
              >
                <LogIn className="w-4 h-4" />
                <span>Iniciar Sesión</span>
              </button>
              <button
                onClick={() => router.push(`${routes.getLoginHref()}?mode=register&redirect=/rastreo`)}
                className="inline-flex items-center justify-center gap-2 bg-surface-card hover:bg-surface-card-hover border border-surface-border text-text-strong font-bold text-xs uppercase tracking-wider py-3.5 px-6 rounded-full transition-all active:scale-95 cursor-pointer font-display"
              >
                <UserPlus className="w-4 h-4" />
                <span>Registrar Teléfono / Cuenta</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
