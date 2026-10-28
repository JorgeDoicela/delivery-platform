"use client";

import type { UseFormRegister, UseFormSetValue, FieldErrors } from "react-hook-form";
import type { CheckoutFormData } from "../schemas/checkoutSchema";
import { FileText } from "lucide-react";

interface BillingInfoSectionProps {
  register: UseFormRegister<CheckoutFormData>;
  setValue: UseFormSetValue<CheckoutFormData>;
  errors: FieldErrors<CheckoutFormData>;
}

export function BillingInfoSection({
  register,
  setValue,
  errors,
}: BillingInfoSectionProps) {
  return (
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
  );
}

