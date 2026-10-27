"use client";

import { useCartStore } from "@/features/cart/store/useCartStore";
import { formatCurrency } from "@/shared/lib/utils";
import { Trash2, Plus, Minus, ShoppingBag, Truck, Store } from "lucide-react";
import Link from "next/link";

export function OrderSummary() {
  const items = useCartStore((s) => s.items);
  const deliveryType = useCartStore((s) => s.deliveryType);
  const setDeliveryType = useCartStore((s) => s.setDeliveryType);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const getSubtotal = useCartStore((s) => s.getSubtotal);
  const getDeliveryFee = useCartStore((s) => s.getDeliveryFee);
  const getTotal = useCartStore((s) => s.getTotal);

  const subtotal = getSubtotal();
  const deliveryFee = getDeliveryFee();
  const total = getTotal();

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <ShoppingBag className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-base">Tu pedido está vacío</h3>
          <p className="text-xs text-slate-500 mt-1">
            Agrega deliciosos combos de pollo asado desde nuestro menú.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center justify-center bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow-md shadow-orange-600/20 transition-all active:scale-95"
        >
          Explorar el Menú
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-5 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-900">Resumen del Pedido</h3>
        <span className="text-xs text-slate-500 font-medium">
          {items.reduce((acc, i) => acc + i.quantity, 0)} ítems
        </span>
      </div>

      {/* Selector de Modalidad (Delivery vs Takeout) */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
        <button
          type="button"
          onClick={() => setDeliveryType("delivery")}
          className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
            deliveryType === "delivery"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Truck className="w-3.5 h-3.5 text-orange-600" />
          <span>A Domicilio</span>
        </button>

        <button
          type="button"
          onClick={() => setDeliveryType("takeout")}
          className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
            deliveryType === "takeout"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Store className="w-3.5 h-3.5 text-orange-600" />
          <span>Retiro en Local</span>
        </button>
      </div>

      {/* Lista de Productos en el Carrito */}
      <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto space-y-3 pr-1">
        {items.map((item) => (
          <div key={item.cartItemId} className="pt-3 first:pt-0 space-y-2">
            <div className="flex items-start justify-between gap-3 text-xs">
              <div className="flex-1">
                <p className="font-bold text-slate-900">{item.name}</p>
                {item.selectedModifiers.length > 0 && (
                  <ul className="text-[11px] text-slate-500 mt-0.5 space-y-0.5">
                    {item.selectedModifiers.map((mod) => (
                      <li key={mod.id}>
                        • {mod.name}
                        {mod.price > 0 && ` (+${formatCurrency(mod.price)})`}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="text-right">
                <p className="font-bold text-slate-900">
                  {formatCurrency(item.itemPrice * item.quantity)}
                </p>
                <p className="text-[10px] text-slate-400">
                  {formatCurrency(item.itemPrice)} c/u
                </p>
              </div>
            </div>

            {/* Controles de Cantidad */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => updateQuantity(item.cartItemId, -1)}
                  className="w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:bg-slate-200"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-4 text-center font-bold text-slate-900 text-xs">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => updateQuantity(item.cartItemId, 1)}
                  className="w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:bg-slate-200"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => removeItem(item.cartItemId)}
                className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desglose de Totales */}
      <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs">
        <div className="flex justify-between text-slate-600">
          <span>Subtotal de productos:</span>
          <span className="font-semibold text-slate-900">{formatCurrency(subtotal)}</span>
        </div>

        <div className="flex justify-between text-slate-600">
          <span>Tarifa de entrega:</span>
          <span className="font-semibold text-slate-900">
            {deliveryFee > 0 ? formatCurrency(deliveryFee) : "Gratis (Retiro)"}
          </span>
        </div>

        <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-black text-slate-900">
          <span>Total a Pagar:</span>
          <span className="text-lg text-orange-600">{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
}
