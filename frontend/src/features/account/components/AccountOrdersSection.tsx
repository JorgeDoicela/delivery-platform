"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  Clock,
  MapPin,
  ExternalLink,
  RotateCcw,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useAccountStore } from "../store/useAccountStore";
import { useCartStore } from "@/features/cart";

export function AccountOrdersSection() {
  const router = useRouter();
  const orders = useAccountStore((s) => s.orders);
  const isLoadingOrders = useAccountStore((s) => s.isLoadingOrders);
  const ordersError = useAccountStore((s) => s.ordersError);
  const fetchOrders = useAccountStore((s) => s.fetchOrders);

  const addItemToCart = useCartStore((s) => s.addItem);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleReorder = (order: (typeof orders)[0]) => {
    // Agregar items al carrito con ID determinista
    order.items.forEach((item, index) => {
      const deterministicId = Math.abs(
        item.productName
          .split("")
          .reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) | 0, 0)
      ) + index + 1;

      addItemToCart({
        productId: deterministicId,
        name: item.productName,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        imageUrl: "",
        selectedModifiers: [],
      });
    });

    // Redirigir al menú del establecimiento sincronizando la sucursal exacta del pedido
    router.push(`/${order.tenantSlug}?branch=${order.branchId}`);
  };

  if (isLoadingOrders) {
    return (
      <div className="bg-surface-card border border-surface-border rounded-3xl p-8 text-center space-y-4 animate-pulse">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-primary" />
        <p className="text-xs text-text-muted font-bold uppercase tracking-wider">
          Cargando historial de pedidos...
        </p>
      </div>
    );
  }

  if (ordersError) {
    return (
      <div className="bg-surface-card border border-surface-border rounded-3xl p-8 text-center space-y-4">
        <AlertCircle className="w-8 h-8 mx-auto text-brand-primary" />
        <p className="text-xs text-text-base font-medium">{ordersError}</p>
        <button
          type="button"
          onClick={() => fetchOrders()}
          className="bg-brand-primary hover:brightness-110 text-white text-xs font-bold uppercase px-6 py-2.5 rounded-full min-h-[44px] cursor-pointer"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-surface-card border border-surface-border rounded-3xl p-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-surface-canvas flex items-center justify-center mx-auto text-text-subtle">
          <Package className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-black text-text-strong font-display uppercase tracking-tight">
            Aún no tienes pedidos registrados
          </h3>
          <p className="text-xs text-text-muted max-w-sm mx-auto">
            Explora las opciones de nuestra plataforma gastronómica y realiza tu primer pedido en minutos.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center bg-brand-primary hover:brightness-110 text-white font-black text-xs uppercase tracking-wider font-display px-8 py-3.5 rounded-full shadow-sm min-h-[44px]"
          >
            Explorar Restaurantes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const orderDate = new Date(order.createdAt).toLocaleDateString("es-EC", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        return (
          <div
            key={order.orderId}
            className="bg-surface-card border border-surface-border rounded-3xl p-6 md:p-7 space-y-5 shadow-xs hover:border-text-subtle/40 transition-colors"
          >
            {/* Cabecera del pedido */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-border pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                  <span className="font-mono text-sm font-black text-text-strong tracking-tight">
                    #{order.orderNumber}
                  </span>
                  <span className="text-xs font-bold text-text-base bg-surface-canvas border border-surface-border px-2.5 py-0.5 rounded-full">
                    {order.tenantName}
                  </span>
                  <span
                    className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      order.isActive
                        ? "bg-brand-primary text-white"
                        : "bg-surface-canvas border border-surface-border text-text-muted"
                    }`}
                  >
                    {order.statusText}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-text-muted">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-text-subtle shrink-0" />
                    <span>{orderDate}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-text-subtle shrink-0" />
                    <span>{order.branchName}</span>
                  </span>
                </div>
              </div>

              {/* Total */}
              <div className="text-left sm:text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-surface-border">
                <span className="text-[11px] uppercase font-bold text-text-subtle block">
                  Total Pagado
                </span>
                <span className="text-xl font-black text-text-strong font-display">
                  ${order.total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Lista de productos */}
            <div className="space-y-2">
              <span className="text-[11px] uppercase font-bold text-text-subtle tracking-wider block">
                Detalle de Productos
              </span>
              <div className="divide-y divide-surface-border border border-surface-border rounded-2xl p-3 bg-surface-canvas/50">
                {order.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-1.5 text-xs gap-3"
                  >
                    <span className="text-text-base break-words">
                      <strong className="font-bold text-text-strong">{item.quantity}x</strong>{" "}
                      {item.productName}
                    </span>
                    <span className="font-mono font-medium text-text-muted shrink-0">
                      ${item.subtotal.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Dirección de entrega */}
            {order.addressStreet && (
              <div className="text-xs text-text-muted flex items-center gap-1.5 break-words">
                <MapPin className="w-3.5 h-3.5 text-text-subtle shrink-0" />
                <span>Entregado en: <strong className="text-text-strong">{order.addressStreet}</strong></span>
              </div>
            )}

            {/* Acciones del pedido */}
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 pt-2">
              <Link
                href={`/${order.tenantSlug}/rastreo/${order.orderId}`}
                className="inline-flex items-center justify-center gap-2 bg-brand-primary hover:brightness-110 active:scale-95 text-white font-black text-xs uppercase tracking-wider font-display px-6 py-2.5 rounded-full transition-all min-h-[44px]"
              >
                <span>{order.isActive ? "Rastrear Pedido en Vivo" : "Ver Resumen"}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>

              <button
                type="button"
                onClick={() => handleReorder(order)}
                className="inline-flex items-center justify-center gap-2 bg-surface-canvas hover:bg-surface-card border border-surface-border active:scale-95 text-text-strong font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-full transition-colors min-h-[44px] cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Pedir Nuevamente</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
