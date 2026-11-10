"use client";

import { useState, useEffect } from "react";
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
import { useAuthStore } from "@/features/auth";
import { useAccountStore } from "@/features/account";
import { apiClient } from "@/shared/lib/api-client";
import { formatCurrency } from "@/shared/lib/utils";
import { useTenantRoutes } from "@/shared/lib/tenant-routing";
import { UserCheck, ShieldCheck, LogIn, Loader2 } from "lucide-react";
import { CheckoutAuthGate } from "./CheckoutAuthGate";

export function CheckoutForm() {
  const router = useRouter();
  const routes = useTenantRoutes();
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
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const profile = useAccountStore((s) => s.profile);
  const fetchProfile = useAccountStore((s) => s.fetchProfile);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: user?.fullName || "",
      customerPhone: "",
      customerEmail: user?.email || "",
      identificationType: "CONSUMIDOR_FINAL",
      identificationNumber: "9999999999999",
      addressStreet: "",
      addressReference: "",
      deliveryType: deliveryType === "delivery" ? 1 : 2,
      paymentMethod: 1, // Efectivo por defecto
      cashAmountPaid: undefined,
    },
  });

  useEffect(() => {
    if (isAuthenticated && !profile) {
      fetchProfile();
    }
  }, [isAuthenticated, profile, fetchProfile]);

  useEffect(() => {
    if (user?.fullName) {
      setValue("customerName", user.fullName);
    }
    if (user?.email) {
      setValue("customerEmail", user.email);
    }
    if (profile) {
      if (profile.fullName) setValue("customerName", profile.fullName);
      if (profile.phone) setValue("customerPhone", profile.phone);
      if (profile.identificationType === "CEDULA" || profile.identificationType === "RUC") {
        setValue("identificationType", profile.identificationType);
        if (profile.identificationNumber) {
          setValue("identificationNumber", profile.identificationNumber);
        }
      }
    }
  }, [user, profile, setValue]);

  const selectedPaymentMethod = useWatch({ control, name: "paymentMethod" });
  const cashAmountPaid = useWatch({ control, name: "cashAmountPaid" }) || 0;
  const changeDue = Math.max(0, cashAmountPaid - total);

  const handleLocationResolved = (lat: number, lng: number) => {
    setCoords({ lat, lng });
    setValue("deliveryLatitude", lat);
    setValue("deliveryLongitude", lng);
  };

  const onSubmit = async (data: CheckoutFormData) => {
    if (!isAuthenticated) {
      setSubmitError("Debes iniciar sesión o registrar tu cuenta para poder confirmar el pedido.");
      document.getElementById("checkout-auth-section")?.scrollIntoView({ behavior: "smooth" });
      return;
    }

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

      // Limpiar carrito y redirigir a tracking en español
      clearCart();
      router.push(routes.getRastreoHref(response.orderId));
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Error al procesar el pedido. Intenta nuevamente.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="pb-28 lg:pb-0">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Columna Izquierda: Cobertura + Secciones Modulares del Formulario */}
        <div className="lg:col-span-7 space-y-6">
          <GeofenceChecker onLocationResolved={handleLocationResolved} />

          <DeliveryInfoSection
            register={register}
            setValue={setValue}
            onLocationSelect={handleLocationResolved}
            errors={errors}
          />

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

          {/* Autenticación Requerida o Banner de Cuenta Verificada */}
          <div id="checkout-auth-section">
            {!isAuthenticated ? (
              <CheckoutAuthGate />
            ) : (
              <div className="p-4 rounded-3xl bg-surface-card border border-surface-border shadow-sm flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-text-strong truncate">
                        {user?.fullName || profile?.fullName || user?.email}
                      </span>
                      <ShieldCheck className="w-3.5 h-3.5 text-status-success shrink-0" />
                    </div>
                    <span className="text-text-muted text-[11px] block truncate">
                      {user?.email} • Cuenta Autenticada
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="text-xs font-bold text-brand-primary hover:underline shrink-0 cursor-pointer"
                >
                  Cambiar
                </button>
              </div>
            )}
          </div>

          {submitError && (
            <div className="p-3.5 rounded-xl bg-status-danger-bg border border-status-danger-border text-xs text-status-danger font-medium leading-relaxed">
              {submitError}
            </div>
          )}

          {isAuthenticated && (
            <button
              type="submit"
              disabled={isSubmitting || items.length === 0}
              className="w-full hidden lg:flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-primary-hover disabled:bg-surface-border disabled:text-text-muted text-white font-black text-sm uppercase tracking-wider py-4 px-8 rounded-full shadow-xl transition-all hover:scale-[1.01] active:scale-95 disabled:active:scale-100 disabled:hover:scale-100 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Procesando e Imprimiendo Comanda...</span>
                </>
              ) : (
                <span>Confirmar y Enviar Pedido ({formatCurrency(total)})</span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Barra Fija Inferior Móvil para Confirmar Pedido (< lg) */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 bg-surface-card/95 backdrop-blur-md border-t border-surface-border p-3.5 sm:p-4 lg:hidden shadow-2xl flex items-center justify-between gap-3 transition-transform"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className="min-w-0">
          <span className="text-[10px] uppercase tracking-wider font-bold text-text-muted block font-display">
            Total ({items.reduce((acc, i) => acc + i.quantity, 0)} {items.reduce((acc, i) => acc + i.quantity, 0) === 1 ? "artículo" : "artículos"})
          </span>
          <span className="text-xl font-black text-brand-primary font-mono tabular-nums leading-none">
            {formatCurrency(total)}
          </span>
        </div>

        {isAuthenticated ? (
          <button
            type="submit"
            disabled={isSubmitting || items.length === 0}
            className="flex-1 max-w-[240px] flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-primary-hover disabled:bg-surface-border disabled:text-text-muted text-white font-black text-xs uppercase tracking-wider py-3.5 px-4 rounded-full shadow-lg transition-all active:scale-95 disabled:active:scale-100 cursor-pointer font-display min-h-[44px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Enviando...</span>
              </>
            ) : (
              <span>Confirmar Pedido</span>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              document.getElementById("checkout-auth-section")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="flex-1 max-w-[240px] flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-primary-hover text-white font-black text-xs uppercase tracking-wider py-3.5 px-4 rounded-full shadow-lg transition-all active:scale-95 cursor-pointer font-display min-h-[44px]"
          >
            <LogIn className="w-4 h-4" />
            <span>Iniciar Sesión para Pedir</span>
          </button>
        )}
      </div>
    </form>
  );
}
