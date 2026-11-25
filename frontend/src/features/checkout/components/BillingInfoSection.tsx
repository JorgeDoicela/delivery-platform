"use client";

import { useState } from "react";
import { useWatch, type UseFormRegister, type UseFormSetValue, type Control, type FieldErrors } from "react-hook-form";
import type { CheckoutFormData } from "../schemas/checkoutSchema";
import { Select, type SelectOption } from "@/shared/components";
import { User, FileText } from "lucide-react";

interface BillingInfoSectionProps {
  register: UseFormRegister<CheckoutFormData>;
  setValue: UseFormSetValue<CheckoutFormData>;
  control?: Control<CheckoutFormData>;
  errors: FieldErrors<CheckoutFormData>;
}

const BILLING_OPTIONS: SelectOption[] = [
  { value: "CEDULA", label: "Cédula de Identidad" },
  { value: "RUC", label: "R.U.C. (Persona Natural / Empresa)", badge: "SRI" },
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

  const [wantsCustomBilling, setWantsCustomBilling] = useState(
    currentIdentificationType !== "CONSUMIDOR_FINAL"
  );

  const handleToggleCustomBilling = (enabled: boolean) => {
    setWantsCustomBilling(enabled);
    if (!enabled) {
      setValue("identificationType", "CONSUMIDOR_FINAL");
      setValue("identificationNumber", "9999999999999");
    } else {
      setValue("identificationType", "CEDULA");
      setValue("identificationNumber", "");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-text-strong font-display">
          Facturación Electrónica SRI
        </h3>
        <p className="text-[11px] text-text-muted">
          Comprobantes autorizados por el Servicio de Rentas Internas
        </p>
      </div>

      {/* Selector: Consumidor Final vs Con Datos */}
      <div className="grid grid-cols-2 rounded-xl overflow-hidden border border-surface-border bg-surface-card">
        <button
          type="button"
          onClick={() => handleToggleCustomBilling(false)}
          className={`py-2 px-2.5 sm:px-4 transition-colors flex flex-col items-center justify-center text-center gap-0.5 cursor-pointer border-r border-surface-border ${
            !wantsCustomBilling
              ? "bg-brand-primary text-white"
              : "bg-surface-card text-text-strong hover:bg-surface-canvas"
          }`}
        >
          <span className="flex items-center justify-center gap-1.5 text-[11px] sm:text-xs font-bold font-display uppercase tracking-wide">
            <User className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${!wantsCustomBilling ? "text-white" : "text-text-muted"}`} />
            <span className="truncate">Consumidor Final</span>
          </span>
          <span className={`text-[10px] leading-tight ${!wantsCustomBilling ? "text-white/85" : "text-text-muted"}`}>
            Sin datos adicionales
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleToggleCustomBilling(true)}
          className={`py-2 px-2.5 sm:px-4 transition-colors flex flex-col items-center justify-center text-center gap-0.5 cursor-pointer ${
            wantsCustomBilling
              ? "bg-brand-primary text-white"
              : "bg-surface-card text-text-strong hover:bg-surface-canvas"
          }`}
        >
          <span className="flex items-center justify-center gap-1.5 text-[11px] sm:text-xs font-bold font-display uppercase tracking-wide">
            <FileText className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${wantsCustomBilling ? "text-white" : "text-text-muted"}`} />
            <span className="truncate">Con Datos / RUC</span>
          </span>
          <span className={`text-[10px] leading-tight ${wantsCustomBilling ? "text-white/85" : "text-text-muted"}`}>
            Para deducir gastos
          </span>
        </button>
      </div>

      {/* Formulario Desplegable cuando solicita Factura con Datos */}
      {wantsCustomBilling && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 animate-in fade-in duration-200">
          <div>
            <Select
              label="Tipo de Identificación"
              options={BILLING_OPTIONS}
              value={currentIdentificationType === "CONSUMIDOR_FINAL" ? "CEDULA" : currentIdentificationType}
              onChange={(val) => {
                const value = val as "CEDULA" | "RUC";
                setValue("identificationType", value);
              }}
              error={errors.identificationType?.message}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-text-base mb-1">
              Número de Identificación (Cédula o RUC) *
            </label>
            <input
              {...register("identificationNumber")}
              placeholder="Ej. 1712345678 o 1790012345001"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-surface-border bg-surface-card text-text-strong focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary"
            />
            {errors.identificationNumber && (
              <p className="text-[11px] text-status-danger mt-1 font-medium">
                {errors.identificationNumber.message}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
