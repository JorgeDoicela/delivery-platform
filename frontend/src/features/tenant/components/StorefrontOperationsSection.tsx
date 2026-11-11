import React from "react";
import type { UpdateTenantStorefrontCommand } from "@/shared/types/api";

interface StorefrontOperationsSectionProps {
  formState: UpdateTenantStorefrontCommand;
  onFieldChange: <K extends keyof UpdateTenantStorefrontCommand>(
    key: K,
    value: UpdateTenantStorefrontCommand[K]
  ) => void;
}

export function StorefrontOperationsSection({
  formState,
  onFieldChange,
}: StorefrontOperationsSectionProps) {
  const inputClass =
    "w-full px-3.5 py-2.5 rounded-xl bg-surface-canvas border border-surface-border text-text-strong focus:outline-none focus:border-brand-primary focus:bg-surface-card transition-colors placeholder:text-text-muted";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 space-y-4 shadow-xs transition-colors duration-200">
        <h3 className="text-base font-black uppercase tracking-wide text-text-strong font-display border-b border-surface-border pb-2">
          Tarifa de Envío y Modalidades de Pedido
        </h3>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1">
            Tarifa Base de Envío a Domicilio (USD)
          </label>
          <input
            type="number"
            step="0.05"
            min="0"
            value={formState.baseDeliveryFee}
            onChange={(e) =>
              onFieldChange("baseDeliveryFee", Number(e.target.value))
            }
            className={`${inputClass} font-mono font-bold`}
          />
        </div>

        <div className="space-y-2.5 pt-2">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-text-muted">
            Modalidades y Métodos de Pago Activos
          </span>
          <label className="flex items-center gap-2.5 cursor-pointer text-text-strong">
            <input
              type="checkbox"
              checked={formState.enableDelivery}
              onChange={(e) => onFieldChange("enableDelivery", e.target.checked)}
              className="rounded border-surface-border"
            />
            <span>Habilitar Entrega a Domicilio</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer text-text-strong">
            <input
              type="checkbox"
              checked={formState.enableTakeout}
              onChange={(e) => onFieldChange("enableTakeout", e.target.checked)}
              className="rounded border-surface-border"
            />
            <span>Habilitar Retiro en Restaurante</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer text-text-strong">
            <input
              type="checkbox"
              checked={formState.acceptsCash}
              onChange={(e) => onFieldChange("acceptsCash", e.target.checked)}
              className="rounded border-surface-border"
            />
            <span>Aceptar Efectivo contra Entrega</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer text-text-strong">
            <input
              type="checkbox"
              checked={formState.acceptsBankTransfer}
              onChange={(e) =>
                onFieldChange("acceptsBankTransfer", e.target.checked)
              }
              className="rounded border-surface-border"
            />
            <span>Aceptar Transferencia Bancaria / Deuna</span>
          </label>
        </div>

        <div className="pt-3 border-t border-surface-border space-y-2">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-text-muted">
            Validación de Cobertura Geográfica
          </span>
          <label className="flex items-start gap-2.5 cursor-pointer text-text-strong">
            <input
              type="checkbox"
              checked={formState.requireCoverageValidation ?? true}
              onChange={(e) =>
                onFieldChange("requireCoverageValidation", e.target.checked)
              }
              className="rounded border-surface-border mt-0.5"
            />
            <div className="space-y-0.5">
              <span className="font-semibold block">Exigir cobertura geográfica estricta</span>
              <p className="text-[11px] text-text-muted leading-tight">
                Si se desactiva, los clientes pueden pedir desde cualquier ubicación y se les asignará la sucursal más cercana mediante cálculo geodésico Haversine.
              </p>
            </div>
          </label>
        </div>
      </div>

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 space-y-4 shadow-xs transition-colors duration-200">
        <h3 className="text-base font-black uppercase tracking-wide text-text-strong font-display border-b border-surface-border pb-2">
          Cuenta Bancaria para Transferencias en Checkout
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1">
              Entidad Bancaria
            </label>
            <input
              type="text"
              value={formState.bankDetails.bankName}
              onChange={(e) =>
                onFieldChange("bankDetails", {
                  ...formState.bankDetails,
                  bankName: e.target.value,
                })
              }
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1">
              Tipo de Cuenta
            </label>
            <input
              type="text"
              value={formState.bankDetails.accountType}
              onChange={(e) =>
                onFieldChange("bankDetails", {
                  ...formState.bankDetails,
                  accountType: e.target.value,
                })
              }
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1">
              Número de Cuenta
            </label>
            <input
              type="text"
              value={formState.bankDetails.accountNumber}
              onChange={(e) =>
                onFieldChange("bankDetails", {
                  ...formState.bankDetails,
                  accountNumber: e.target.value,
                })
              }
              className={`${inputClass} font-mono`}
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1">
              RUC / Cédula del Titular
            </label>
            <input
              type="text"
              value={formState.bankDetails.taxId}
              onChange={(e) =>
                onFieldChange("bankDetails", {
                  ...formState.bankDetails,
                  taxId: e.target.value,
                })
              }
              className={`${inputClass} font-mono`}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1">
              Nombre del Titular de la Cuenta
            </label>
            <input
              type="text"
              value={formState.bankDetails.accountHolder}
              onChange={(e) =>
                onFieldChange("bankDetails", {
                  ...formState.bankDetails,
                  accountHolder: e.target.value,
                })
              }
              className={inputClass}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
