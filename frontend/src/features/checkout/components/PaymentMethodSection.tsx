"use client";

import type { UseFormRegister, UseFormSetValue } from "react-hook-form";
import type { CheckoutFormData } from "../schemas/checkoutSchema";
import { formatCurrency } from "@/shared/lib/utils";
import { Banknote, Building2, CheckCircle2 } from "lucide-react";

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
  return (
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
  );
}

