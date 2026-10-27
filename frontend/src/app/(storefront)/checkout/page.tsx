"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { checkoutSchema, type CheckoutFormData } from "@/features/checkout/schemas/checkoutSchema";
import { GeofenceChecker } from "@/features/checkout/components/GeofenceChecker";
import { OrderSummary } from "@/features/checkout/components/OrderSummary";
import { useCartStore } from "@/features/cart/store/useCartStore";
import { apiClient } from "@/shared/lib/api-client";
import { formatCurrency } from "@/shared/lib/utils";
import {
  Banknote,
  Building2,
  CheckCircle2,
  FileText,
  Loader2,
  ShieldCheck,
  User,
} from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const branchId = useCartStore((s) => s.branchId);
  const deliveryType = useCartStore((s) => s.deliveryType);
  const getTotal = useCartStore((s) => s.getTotal);
  const clearCart = useCartStore((s) => s.clearCart);

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>({
    lat: -0.1782,
    lng: -78.4845,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const total = getTotal();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      identificationType: "CONSUMIDOR_FINAL",
      identificationNumber: "9999999999999",
      addressStreet: "",
      addressReference: "",
      deliveryType: deliveryType === "delivery" ? 1 : 2,
      paymentMethod: 1, // Efectivo por defecto
      cashAmountPaid: undefined,
    },
  });

  const selectedPaymentMethod = useWatch({ control, name: "paymentMethod" });
  const cashAmountPaid = useWatch({ control, name: "cashAmountPaid" }) || 0;
  const changeDue = Math.max(0, cashAmountPaid - total);

  const handleLocationResolved = (lat: number, lng: number) => {
    setCoords({ lat, lng });
    setValue("deliveryLatitude", lat);
    setValue("deliveryLongitude", lng);
  };

  const onSubmit = async (data: CheckoutFormData) => {
    if (items.length === 0) {
      setSubmitError("Tu pedido está vacío. Agrega productos antes de continuar.");
      return;
    }

    if (!branchId) {
      setSubmitError("Debes verificar tu ubicación para asignar una sucursal.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const idempotencyKey = crypto.randomUUID();

    try {
      const response = await apiClient.createOrder(
        {
          branchId,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          customerEmail: data.customerEmail || undefined,
          identificationType: data.identificationType,
          identificationNumber: data.identificationNumber,
          addressStreet: data.addressStreet,
          addressReference: data.addressReference || undefined,
          deliveryLatitude: coords?.lat,
          deliveryLongitude: coords?.lng,
          deliveryType: deliveryType === "delivery" ? 1 : 2,
          paymentMethod: data.paymentMethod,
          cashAmountPaid: data.paymentMethod === 1 ? data.cashAmountPaid : undefined,
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            selectedModifierOptionIds: i.selectedModifiers.map((m) => m.id),
          })),
        },
        idempotencyKey
      );

      // Limpiar carrito y redirigir a tracking
      clearCart();
      router.push(`/track/${response.orderId}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Error al procesar el pedido. Intenta nuevamente.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Finalizar Pedido
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Ingresa tus datos de entrega y método de pago sin fricción
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Columna Izquierda: Cobertura + Formulario */}
          <div className="lg:col-span-7 space-y-6">
            {/* Validación Espacial con PostGIS */}
            <GeofenceChecker onLocationResolved={handleLocationResolved} />

            {/* Datos de Despacho y Contacto */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Datos de Entrega</h3>
                  <p className="text-[11px] text-slate-500">
                    Información para el repartidor y comanda física de cocina
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    {...register("customerName")}
                    placeholder="Ej. Carlos Mendoza"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                  {errors.customerName && (
                    <p className="text-[11px] text-red-500 mt-1 font-medium">
                      {errors.customerName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Teléfono Celular *
                  </label>
                  <input
                    {...register("customerPhone")}
                    placeholder="Ej. 0987654321"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                  {errors.customerPhone && (
                    <p className="text-[11px] text-red-500 mt-1 font-medium">
                      {errors.customerPhone.message}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dirección Exacta (Calle y Número) *
                  </label>
                  <input
                    {...register("addressStreet")}
                    placeholder="Ej. Av. Amazonas N34-120 y República"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                  {errors.addressStreet && (
                    <p className="text-[11px] text-red-500 mt-1 font-medium">
                      {errors.addressStreet.message}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Referencia de Despacho (Edificio, Timbre, Color)
                  </label>
                  <input
                    {...register("addressReference")}
                    placeholder="Ej. Edificio Sky, Timbre 4B, junto a la farmacia"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* Datos de Facturación SRI */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Facturación Electrónica</h3>
                  <p className="text-[11px] text-slate-500">
                    Comprobantes autorizados por el SRI posterior al pago
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tipo de Comprobante
                  </label>
                  <select
                    {...register("identificationType")}
                    onChange={(e) => {
                      const value = e.target.value as CheckoutFormData["identificationType"];
                      setValue("identificationType", value);
                      if (value === "CONSUMIDOR_FINAL") {
                        setValue("identificationNumber", "9999999999999");
                      } else {
                        setValue("identificationNumber", "");
                      }
                    }}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  >
                    <option value="CONSUMIDOR_FINAL">Consumidor Final</option>
                    <option value="CEDULA">Cédula de Identidad</option>
                    <option value="RUC">R.U.C.</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Número de Cédula / RUC *
                  </label>
                  <input
                    {...register("identificationNumber")}
                    placeholder="9999999999999"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                  {errors.identificationNumber && (
                    <p className="text-[11px] text-red-500 mt-1 font-medium">
                      {errors.identificationNumber.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Método de Pago */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Banknote className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Método de Pago</h3>
                  <p className="text-[11px] text-slate-500">
                    Selecciona cómo deseas cancelar tu pedido
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setValue("paymentMethod", 1)}
                  className={`p-3.5 rounded-xl border text-left text-xs transition-all flex flex-col justify-between ${
                    selectedPaymentMethod === 1
                      ? "border-orange-500 bg-orange-50/50 shadow-sm"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Banknote className="w-5 h-5 text-orange-600" />
                    {selectedPaymentMethod === 1 && (
                      <CheckCircle2 className="w-4 h-4 text-orange-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Efectivo contra Entrega</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Paga al repartidor al recibir</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setValue("paymentMethod", 2)}
                  className={`p-3.5 rounded-xl border text-left text-xs transition-all flex flex-col justify-between ${
                    selectedPaymentMethod === 2
                      ? "border-orange-500 bg-orange-50/50 shadow-sm"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    {selectedPaymentMethod === 2 && (
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Transferencia / Deuna</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Validación previa con cajero</p>
                  </div>
                </button>
              </div>

              {/* Detalle si selecciona Efectivo */}
              {selectedPaymentMethod === 1 && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-in fade-in text-xs">
                  <label className="block font-bold text-slate-800">
                    ¿Con cuánto billete pagarás para enviarte cambio exacto?
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {[20, 30, 50].map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setValue("cashAmountPaid", amount)}
                        className={`px-3 py-1.5 rounded-lg border font-bold text-xs transition-colors ${
                          cashAmountPaid === amount
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        $ {amount}.00
                      </button>
                    ))}
                  </div>

                  <div className="pt-2">
                    <input
                      type="number"
                      step="0.01"
                      {...register("cashAmountPaid", { valueAsNumber: true })}
                      placeholder={`Monto exacto (mínimo ${formatCurrency(total)})`}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                  </div>

                  {cashAmountPaid > 0 && (
                    <div className="flex justify-between items-center text-xs font-bold pt-1">
                      <span className="text-slate-600">Cambio a entregar por el repartidor:</span>
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {formatCurrency(changeDue)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Detalle si selecciona Transferencia */}
              {selectedPaymentMethod === 2 && (
                <div className="p-4 bg-blue-50/60 border border-blue-200/80 rounded-xl space-y-2 text-xs text-blue-950 animate-in fade-in">
                  <p className="font-bold">Datos Bancarios para Transferencia:</p>
                  <p className="text-[11px] leading-relaxed">
                    Banco Pichincha | Cta. Corriente: 2100456789 | Titular: Delivery Platform S.A. | RUC: 1792345678001
                  </p>
                  <p className="text-[10px] text-blue-800">
                    * El cajero verificará la acreditación bancaria antes de enviar la orden al horno.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Columna Derecha: Resumen de Pedido y Botón Final */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
            <OrderSummary />

            {/* Mensaje de Error al enviar */}
            {submitError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium leading-relaxed">
                {submitError}
              </div>
            )}

            {/* Botón de Confirmación Definitiva */}
            <button
              type="submit"
              disabled={isSubmitting || items.length === 0}
              className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-300 text-white font-extrabold text-sm py-4 px-6 rounded-2xl shadow-xl shadow-orange-600/30 transition-all active:scale-95 disabled:active:scale-100"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Procesando e Imprimiendo Comanda...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  <span>Confirmar y Enviar Pedido ({formatCurrency(total)})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
