"use client";

import { useWatch, type UseFormRegister, type UseFormSetValue, type Control, type FieldErrors } from "react-hook-form";
import type { CheckoutFormData } from "../schemas/checkoutSchema";
import { FileText } from "lucide-react";
import { Select, type SelectOption } from "@/shared/components";

interface BillingInfoSectionProps {
  register: UseFormRegister<CheckoutFormData>;
  setValue: UseFormSetValue<CheckoutFormData>;
  control?: Control<CheckoutFormData>;
  errors: FieldErrors<CheckoutFormData>;
}

const BILLING_OPTIONS: SelectOption[] = [
  { value: "CONSUMIDOR_FINAL", label: "Consumidor Final" },
  { value: "CEDULA", label: "Cédula de Identidad" },
  { value: "RUC", label: "R.U.C.", badge: "SRI" },
];

export function BillingInfoSection({
  register,
  setValue,
  control,
  errors,
}: BillingInfoSectionProps) {
  const currentIdentificationType = useWatch({
    control,
    name: "identificationType",
    defaultValue: "CONSUMIDOR_FINAL",
  });

  return (
    <div className="bg-surface-card rounded-2xl border border-surface-border p-5 space-y-4 shadow-sm">
      <div className="flex items-center gap-2 pb-3 border-b border-surface-border-subtle">
        <div className="w-8 h-8 rounded-lg bg-surface-canvas text-text-strong flex items-center justify-center">
          <FileText className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-text-strong font-display">Facturación Electrónica</h3>
          <p className="text-[11px] text-text-muted">
            Comprobantes autorizados por el SRI posterior al pago
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Select
            label="Tipo de Comprobante"
            options={BILLING_OPTIONS}
            value={currentIdentificationType}
            onChange={(val) => {
              const value = val as CheckoutFormData["identificationType"];
              setValue("identificationType", value);
              if (value === "CONSUMIDOR_FINAL") {
                setValue("identificationNumber", "9999999999999");
              } else {
                setValue("identificationNumber", "");
              }
            }}
            error={errors.identificationType?.message}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-text-base mb-1">
            Número de Cédula / RUC *
          </label>
          <input
            {...register("identificationNumber")}
            placeholder="9999999999999"
            className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-surface-border bg-surface-card text-text-strong focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary"
          />
          {errors.identificationNumber && (
            <p className="text-[11px] text-status-danger mt-1 font-medium">
              {errors.identificationNumber.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

