"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { checkoutSchema, type CheckoutFormData } from "../schemas/checkoutSchema";
import { GeofenceChecker } from "./GeofenceChecker";
import { OrderSummary } from "./OrderSummary";
import { DeliveryInfoSection } from "./DeliveryInfoSection";
import { BillingInfoSection } from "./BillingInfoSection";
import { PaymentMethodSection } from "./PaymentMethodSection";
import { useCartStore } from "@/features/cart";
import { apiClient } from "@/shared/lib/api-client";
import { formatCurrency } from "@/shared/lib/utils";
import { Loader2, ShieldCheck } from "lucide-react";

export function CheckoutForm() {
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
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Columna Izquierda: Cobertura + Secciones Modulares del Formulario */}
        <div className="lg:col-span-7 space-y-6">
          <GeofenceChecker onLocationResolved={handleLocationResolved} />

          <DeliveryInfoSection register={register} errors={errors} />

          <BillingInfoSection register={register} setValue={setValue} errors={errors} />

          <PaymentMethodSection
            register={register}
            setValue={setValue}
            selectedPaymentMethod={selectedPaymentMethod}
            cashAmountPaid={cashAmountPaid}
            changeDue={changeDue}
            total={total}
          />
        </div>

        {/* Columna Derecha: Resumen de Pedido y Botón Final */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          <OrderSummary />

          {submitError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium leading-relaxed">
              {submitError}
            </div>
          )}

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
  );
}
