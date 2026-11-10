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
      <div className="bg-white border border-neutral-200 rounded-3xl p-8 text-center space-y-4 animate-pulse">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-neutral-400" />
        <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">
          Cargando historial de pedidos...
        </p>
      </div>
    );
  }

  if (ordersError) {
    return (
      <div className="bg-white border border-neutral-200 rounded-3xl p-8 text-center space-y-4">
        <AlertCircle className="w-8 h-8 mx-auto text-brand-primary" />
        <p className="text-xs text-neutral-600 font-medium">{ordersError}</p>
        <button
          type="button"
          onClick={() => fetchOrders()}
          className="bg-neutral-900 text-white text-xs font-bold uppercase px-6 py-2.5 rounded-full min-h-[44px]"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white border border-neutral-200 rounded-3xl p-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
          <Package className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-black text-neutral-900 font-display uppercase tracking-tight">
            Aún no tienes pedidos registrados
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Explora las opciones de nuestra plataforma gastronómica y realiza tu primer pedido en minutos.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center bg-neutral-900 hover:bg-neutral-800 text-white font-black text-xs uppercase tracking-wider font-display px-8 py-3.5 rounded-full shadow-sm min-h-[44px]"
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
            className="bg-white border border-neutral-200 rounded-3xl p-6 md:p-7 space-y-5 shadow-xs hover:border-neutral-300 transition-colors"
          >
            {/* Cabecera del pedido */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-black text-neutral-900 tracking-tight">
                    #{order.orderNumber}
                  </span>
                  <span className="text-xs font-bold text-neutral-700 bg-neutral-100 px-2.5 py-0.5 rounded-full">
                    {order.tenantName}
                  </span>
                  <span
                    className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      order.isActive
                        ? "bg-neutral-900 text-white"
                        : "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    {order.statusText}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1.5 text-xs text-neutral-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-neutral-400" />
                    {orderDate}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                    {order.branchName}
                  </span>
                </div>
              </div>

              {/* Total */}
              <div className="text-left sm:text-right">
                <span className="text-xs uppercase font-bold text-neutral-400 block">
                  Total Pagado
                </span>
                <span className="text-xl font-black text-neutral-900 font-display">
                  ${order.total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Lista de productos */}
            <div className="space-y-2">
              <span className="text-[11px] uppercase font-bold text-neutral-400 tracking-wider block">
                Detalle de Productos
              </span>
              <div className="divide-y divide-neutral-100 border border-neutral-100 rounded-2xl p-3 bg-neutral-50/50">
                {order.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-1.5 text-xs"
                  >
                    <span className="text-neutral-800">
                      <strong className="font-bold">{item.quantity}x</strong>{" "}
                      {item.productName}
                    </span>
                    <span className="font-mono font-medium text-neutral-600">
                      ${item.subtotal.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Dirección de entrega */}
            {order.addressStreet && (
              <div className="text-xs text-neutral-500 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span>Entregado en: <strong className="text-neutral-700">{order.addressStreet}</strong></span>
              </div>
            )}

            {/* Acciones del pedido */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href={`/${order.tenantSlug}/pedidos/${order.orderId}`}
                className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 active:scale-95 text-white font-black text-xs uppercase tracking-wider font-display px-6 py-2.5 rounded-full transition-all min-h-[44px]"
              >
                <span>{order.isActive ? "Rastrear Pedido en Vivo" : "Ver Resumen"}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>

              <button
                type="button"
                onClick={() => handleReorder(order)}
                className="inline-flex items-center gap-2 bg-neutral-100 hover:bg-neutral-200 active:scale-95 text-neutral-800 font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-full transition-colors min-h-[44px] cursor-pointer"
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
