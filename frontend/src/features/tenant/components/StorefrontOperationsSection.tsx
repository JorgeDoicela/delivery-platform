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
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
      <div className="bg-surface-dark-card border border-surface-dark-border rounded-3xl p-6 space-y-4">
        <h3 className="text-base font-black uppercase tracking-wide text-text-inverse-strong font-display border-b border-surface-dark-border pb-2">
          Tarifa de Envío y Modalidades de Pedido
        </h3>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-text-inverse-muted mb-1">
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
            className="w-full px-3.5 py-2.5 rounded-xl bg-surface-dark border border-surface-dark-border text-text-inverse-strong font-mono font-bold focus:outline-none focus:border-brand-primary"
          />
        </div>

        <div className="space-y-2.5 pt-2">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-text-inverse-muted">
            Modalidades y Métodos de Pago Activos
          </span>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={formState.enableDelivery}
              onChange={(e) => onFieldChange("enableDelivery", e.target.checked)}
            />
            <span>Habilitar Entrega a Domicilio</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={formState.enableTakeout}
              onChange={(e) => onFieldChange("enableTakeout", e.target.checked)}
            />
            <span>Habilitar Retiro en Restaurante</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={formState.acceptsCash}
              onChange={(e) => onFieldChange("acceptsCash", e.target.checked)}
            />
            <span>Aceptar Efectivo contra Entrega</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={formState.acceptsBankTransfer}
              onChange={(e) =>
                onFieldChange("acceptsBankTransfer", e.target.checked)
              }
            />
            <span>Aceptar Transferencia Bancaria / Deuna</span>
          </label>
        </div>
      </div>

      <div className="bg-surface-dark-card border border-surface-dark-border rounded-3xl p-6 space-y-4">
        <h3 className="text-base font-black uppercase tracking-wide text-text-inverse-strong font-display border-b border-surface-dark-border pb-2">
          Cuenta Bancaria para Transferencias en Checkout
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-text-inverse-muted mb-1">
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
              className="w-full px-3 py-2 rounded-xl bg-surface-dark border border-surface-dark-border text-text-inverse-strong"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-text-inverse-muted mb-1">
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
              className="w-full px-3 py-2 rounded-xl bg-surface-dark border border-surface-dark-border text-text-inverse-strong"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-text-inverse-muted mb-1">
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
              className="w-full px-3 py-2 rounded-xl bg-surface-dark border border-surface-dark-border text-text-inverse-strong font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-text-inverse-muted mb-1">
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
              className="w-full px-3 py-2 rounded-xl bg-surface-dark border border-surface-dark-border text-text-inverse-strong font-mono"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-text-inverse-muted mb-1">
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
              className="w-full px-3 py-2 rounded-xl bg-surface-dark border border-surface-dark-border text-text-inverse-strong"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

