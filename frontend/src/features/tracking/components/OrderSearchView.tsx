"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useAuthStore } from "@/features/auth";
import { useAccountStore } from "@/features/account";
import { useTenantRoutes } from "@/shared/lib/tenant-routing";
import { formatCurrency, formatDate } from "@/shared/lib/utils";
import { useLiveOrdersSync } from "../hooks/useLiveOrdersSync";
import { useIsMounted } from "@/shared/hooks/useIsMounted";
import {
  MapPin,
  ArrowRight,
  Clock,
  LogIn,
  UserPlus,
  RefreshCw,
  ShoppingBag,
  ExternalLink,
} from "lucide-react";

export function OrderSearchView() {
  const routes = useTenantRoutes();
  const isMounted = useIsMounted();
  const rawIsAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const rawUser = useAuthStore((s) => s.user);

  const isAuthenticated = isMounted && rawIsAuthenticated;
  const user = isMounted ? rawUser : null;

  const orders = useAccountStore((s) => s.orders);
  const loadingOrders = useAccountStore((s) => s.isLoadingOrders);
  const fetchOrders = useAccountStore((s) => s.fetchOrders);

  const activeOrders = useMemo(() => orders.filter((o) => o.isActive), [orders]);
  const activeOrderIds = useMemo(() => activeOrders.map((o) => o.orderId), [activeOrders]);

  useLiveOrdersSync({
    isAuthenticated,
    userId: user?.id,
    orderIds: activeOrderIds,
    onSync: fetchOrders,
  });

  return (
    <div className="w-full max-w-4xl mx-auto py-8 sm:py-12 space-y-10">
      {/* Cabecera Principal */}
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-black text-text-strong uppercase tracking-wide font-display">
          Mis Pedidos
        </h1>
      </div>

      {/* Estado de Hidratación Seguro y Estados de Autenticación */}
      {!isMounted ? (
        <div className="py-12 text-center space-y-3 animate-pulse">
          <div className="h-4 bg-surface-border rounded-full w-48 mx-auto" />
          <div className="h-3 bg-surface-border rounded-full w-64 mx-auto" />
        </div>
      ) : isAuthenticated ? (
        <div className="space-y-6">
          {activeOrders.length > 0 && (
            <div className="pb-3 border-b border-surface-border">
              <h2 className="text-sm font-bold uppercase tracking-wider text-text-strong font-display flex items-center gap-2">
                <span>Tus Pedidos en Curso</span>
                <span className="px-2 py-0.5 rounded-full bg-brand-primary text-white text-[11px] font-mono">
                  {activeOrders.length}
                </span>
              </h2>
            </div>
          )}

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
                    <Link
                      href={routes.getPedidosHref(order.orderId)}
                      className="inline-flex items-center gap-2 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-black uppercase tracking-wider py-2.5 px-5 rounded-full shadow-md transition-all active:scale-95 cursor-pointer font-display"
                    >
                      <span>Rastrear en Vivo</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 sm:py-12 text-center space-y-4">
              <ShoppingBag className="w-12 h-12 text-text-muted mx-auto stroke-[1.5]" />
              <div className="space-y-1.5">
                <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-text-strong font-display">
                  No tienes pedidos en preparación
                </h3>
                <p className="text-xs text-text-muted max-w-md mx-auto leading-relaxed">
                  Todos tus pedidos anteriores ya fueron entregados. Al realizar una nueva orden en tienda, por aplicación o vía WhatsApp, aparecerá aquí automáticamente.
                </p>
              </div>
              <div className="pt-2 flex flex-wrap justify-center gap-3">
                <Link
                  href={routes.getCatalogHref()}
                  className="inline-flex items-center gap-1.5 px-6 py-3 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs uppercase tracking-wider rounded-full font-black shadow-md transition-all cursor-pointer font-display"
                >
                  <span>Ver Menú del Restaurante</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href={`${routes.getAccountHref()}?tab=pedidos`}
                  className="inline-flex items-center gap-1.5 px-6 py-3 bg-surface-card hover:bg-surface-card-hover border border-surface-border text-text-strong text-xs uppercase tracking-wider rounded-full font-bold transition-all cursor-pointer font-display shadow-xs"
                >
                  <span>Historial de Compras</span>
                </Link>
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
              <Link
                href={`${routes.getLoginHref()}?redirect=/pedidos`}
                className="inline-flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-primary-hover text-white font-black text-xs uppercase tracking-wider py-3.5 px-6 rounded-full shadow-md transition-all active:scale-95 cursor-pointer font-display"
              >
                <LogIn className="w-4 h-4" />
                <span>Iniciar Sesión</span>
              </Link>
              <Link
                href={`${routes.getLoginHref()}?mode=register&redirect=/pedidos`}
                className="inline-flex items-center justify-center gap-2 bg-surface-card hover:bg-surface-card-hover border border-surface-border text-text-strong font-bold text-xs uppercase tracking-wider py-3.5 px-6 rounded-full transition-all active:scale-95 cursor-pointer font-display"
              >
                <UserPlus className="w-4 h-4" />
                <span>Registrar Teléfono / Cuenta</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
