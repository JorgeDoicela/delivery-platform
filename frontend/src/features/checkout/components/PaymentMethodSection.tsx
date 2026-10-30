"use client";

import type { UseFormRegister, UseFormSetValue } from "react-hook-form";
import type { CheckoutFormData } from "../schemas/checkoutSchema";
import { formatCurrency } from "@/shared/lib/utils";
import { Banknote, Building2, CheckCircle2 } from "lucide-react";
import { useCurrentTenantQuery } from "@/features/tenant";

interface PaymentMethodSectionProps {
  register: UseFormRegister<CheckoutFormData>;
  setValue: UseFormSetValue<CheckoutFormData>;
  selectedPaymentMethod: number;
  cashAmountPaid: number;
  changeDue: number;
  total: number;
}

export function PaymentMethodSection({
  register,
  setValue,
  selectedPaymentMethod,
  cashAmountPaid,
  changeDue,
  total,
}: PaymentMethodSectionProps) {
  const { data: tenant } = useCurrentTenantQuery();
  const bankDetails = tenant?.bankDetails;
  const acceptsCash = tenant?.acceptsCash ?? true;
  const acceptsBankTransfer = tenant?.acceptsBankTransfer ?? true;

  return (
    <div className="bg-surface-card rounded-2xl border border-surface-border p-5 space-y-4 shadow-sm">
      <div className="flex items-center gap-2 pb-3 border-b border-surface-border-subtle">
        <div className="w-8 h-8 rounded-lg bg-surface-canvas text-text-base flex items-center justify-center">
          <Banknote className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-text-strong font-display">
            Método de Pago • {tenant?.name}
          </h3>
          <p className="text-[11px] text-text-muted">
            Selecciona cómo deseas cancelar tu pedido
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {acceptsCash && (
          <button
            type="button"
            onClick={() => setValue("paymentMethod", 1)}
            className={`p-4 rounded-2xl border text-left text-xs transition-all flex flex-col justify-between ${
              selectedPaymentMethod === 1
                ? "border-2 border-brand-primary bg-white shadow-sm"
                : "border-surface-border hover:border-surface-border-subtle bg-surface-card"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <Banknote className="w-5 h-5 text-brand-primary" />
              {selectedPaymentMethod === 1 && (
                <CheckCircle2 className="w-4 h-4 text-brand-primary" />
              )}
            </div>
            <div>
              <p className="font-bold text-text-strong">
                Efectivo contra Entrega
              </p>
              <p className="text-[10px] text-text-muted mt-0.5">
                Paga al repartidor al recibir
              </p>
            </div>
          </button>
        )}

        {acceptsBankTransfer && (
          <button
            type="button"
            onClick={() => setValue("paymentMethod", 2)}
            className={`p-4 rounded-2xl border text-left text-xs transition-all flex flex-col justify-between ${
              selectedPaymentMethod === 2
                ? "border-2 border-brand-primary bg-white shadow-sm"
                : "border-surface-border hover:border-surface-border-subtle bg-surface-card"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <Building2 className="w-5 h-5 text-brand-primary" />
              {selectedPaymentMethod === 2 && (
                <CheckCircle2 className="w-4 h-4 text-brand-primary" />
              )}
            </div>
            <div>
              <p className="font-bold text-text-strong">
                Transferencia / Deuna
              </p>
              <p className="text-[10px] text-text-muted mt-0.5">
                Validación previa con cajero
              </p>
            </div>
          </button>
        )}
      </div>

      {selectedPaymentMethod === 1 && (
        <div className="p-4 bg-surface-canvas border border-surface-border rounded-2xl space-y-3 animate-in fade-in text-xs">
          <label className="block font-bold text-text-strong">
            ¿Con cuánto billete pagarás para enviarte cambio exacto?
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {[20, 30, 50].map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => setValue("cashAmountPaid", amount)}
                className={`px-4 py-2 rounded-full border font-bold text-xs transition-colors ${
                  cashAmountPaid === amount
                    ? "bg-brand-primary text-text-inverse-strong border-brand-primary shadow-sm"
                    : "bg-surface-card text-text-base border-surface-border hover:bg-surface-canvas"
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
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-surface-border bg-surface-card text-text-strong focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary"
            />
          </div>

          {cashAmountPaid > 0 && (
            <div className="flex justify-between items-center text-xs font-bold pt-1">
              <span className="text-text-base">
                Cambio a entregar por el repartidor:
              </span>
              <span className="text-status-success bg-status-success/10 px-2 py-0.5 rounded border border-status-success/20">
                {formatCurrency(changeDue)}
              </span>
            </div>
          )}
        </div>
      )}

      {selectedPaymentMethod === 2 && (
        <div className="p-4 bg-status-info/10 border border-status-info/30 rounded-xl space-y-2 text-xs text-status-info animate-in fade-in">
          <p className="font-bold">
            Datos Bancarios para Transferencia ({tenant?.name}):
          </p>
          <p className="text-[11px] leading-relaxed">
            {bankDetails?.bankName || "Banco Pichincha"} |{" "}
            {bankDetails?.accountType || "Cta. Corriente"}:{" "}
            {bankDetails?.accountNumber || "2100456789"} | Titular:{" "}
            {bankDetails?.accountHolder || tenant?.businessName} | RUC:{" "}
            {bankDetails?.taxId || tenant?.taxId}
          </p>
          <p className="text-[10px] text-status-info/90">
            * El cajero verificará la acreditación bancaria antes de enviar la
            orden a cocina.
          </p>
        </div>
      )}
    </div>
  );
}
