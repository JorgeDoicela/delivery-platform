import React from "react";
import { Plus, Trash2 } from "lucide-react";
import type { TenantBankDetailsDto, UpdateTenantStorefrontCommand } from "@/shared/types/api";

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

        {/* Motor de Tarifa Dinámica por Distancia */}
        <div className="pt-3 border-t border-surface-border space-y-3">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-text-muted">
            Cálculo Dinámico por Distancia
          </span>

          <label className="flex items-start gap-2.5 cursor-pointer text-text-strong">
            <input
              type="checkbox"
              checked={formState.enableDynamicDistanceFee ?? false}
              onChange={(e) =>
                onFieldChange("enableDynamicDistanceFee", e.target.checked)
              }
              className="rounded border-surface-border mt-0.5"
            />
            <div className="space-y-0.5">
              <span className="font-semibold block">
                Calcular envío dinámicamente según distancia del cliente
              </span>
              <p className="text-[11px] text-text-muted leading-tight">
                Usa la distancia vial estimada (Haversine × 1.25) desde la sucursal más cercana y redondea a múltiplos de $0.05.
              </p>
            </div>
          </label>

          {formState.enableDynamicDistanceFee && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-surface-canvas/50 border border-surface-border">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">
                  Km incluidos en base
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formState.baseDeliveryDistanceKm ?? 2}
                  onChange={(e) =>
                    onFieldChange("baseDeliveryDistanceKm", Number(e.target.value))
                  }
                  className={`${inputClass} font-mono`}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">
                  Extra por km (USD)
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  value={formState.extraDeliveryFeePerKm ?? 0.5}
                  onChange={(e) =>
                    onFieldChange("extraDeliveryFeePerKm", Number(e.target.value))
                  }
                  className={`${inputClass} font-mono`}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">
                  Tope máximo (USD)
                </label>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  placeholder="Sin tope"
                  value={formState.maxDeliveryFee ?? ""}
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    onFieldChange("maxDeliveryFee", val === "" ? null : Number(val));
                  }}
                  className={`${inputClass} font-mono`}
                />
              </div>

              <p className="sm:col-span-3 text-[11px] text-text-muted">
                Simulación a <strong className="text-text-strong">4 km</strong> de recorrido:{" "}
                <strong className="font-mono text-brand-primary">
                  $
                  {(() => {
                    const base = Math.max(0, formState.baseDeliveryFee || 0);
                    const included = Math.max(0, formState.baseDeliveryDistanceKm ?? 2);
                    const perKm = Math.max(0, formState.extraDeliveryFeePerKm ?? 0.5);
                    const raw = base + Math.max(0, 4 - included) * perKm;
                    let rounded = Math.round(raw * 20) / 20;
                    if (formState.maxDeliveryFee && formState.maxDeliveryFee > 0) {
                      rounded = Math.min(rounded, formState.maxDeliveryFee);
                    }
                    return rounded.toFixed(2);
                  })()}
                </strong>
              </p>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1">
              Envío gratis en pedidos desde (USD, opcional)
            </label>
            <input
              type="number"
              step="1"
              min="0"
              placeholder="Desactivado (dejar vacío)"
              value={formState.freeDeliveryMinOrderAmount ?? ""}
              onChange={(e) => {
                const val = e.target.value.trim();
                onFieldChange(
                  "freeDeliveryMinOrderAmount",
                  val === "" ? null : Number(val)
                );
              }}
              className={`${inputClass} font-mono`}
            />
          </div>
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
            Facturación y Datos Fiscales
          </span>
          <label className="flex items-start gap-2.5 cursor-pointer text-text-strong">
            <input
              type="checkbox"
              checked={formState.allowCustomBilling ?? true}
              onChange={(e) =>
                onFieldChange("allowCustomBilling", e.target.checked)
              }
              className="rounded border-surface-border mt-0.5"
            />
            <div className="space-y-0.5">
              <span className="font-semibold block">Permitir factura con datos (Cédula / RUC)</span>
              <p className="text-[11px] text-text-muted leading-tight">
                Si se desactiva, todos los pedidos se registran como Consumidor Final y se ocultan los campos de facturación (Cédula / RUC) en el checkout y en el perfil del cliente.
              </p>
            </div>
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

        <div className="pt-3 border-t border-surface-border space-y-3">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-text-muted">
            Flujo Operativo de Cocina (KDS) y Mostrador
          </span>

          <label className="flex items-start gap-2.5 cursor-pointer text-text-strong">
            <input
              type="checkbox"
              checked={formState.enableKitchenWorkflow ?? true}
              onChange={(e) =>
                onFieldChange("enableKitchenWorkflow", e.target.checked)
              }
              className="rounded border-surface-border mt-0.5"
            />
            <div className="space-y-0.5">
              <span className="font-semibold block">
                Usar pantalla y rol de Cocina (KDS)
              </span>
              <p className="text-[11px] text-text-muted leading-tight">
                Activado: los pedidos pasan por Confirmado &rarr; En Cocina &rarr; Listo. Desactivado: flujo directo en Mostrador sin etapa intermedia de cocina (cada sucursal puede sobrescribir esta regla en /admin/sucursales).
              </p>
            </div>
          </label>

          {!(formState.enableKitchenWorkflow ?? true) && (
            <label className="flex items-start gap-2.5 cursor-pointer text-text-strong pl-4 border-l-2 border-brand-primary/30">
              <input
                type="checkbox"
                checked={formState.allowDirectCounterTakeoutDelivery ?? true}
                onChange={(e) =>
                  onFieldChange(
                    "allowDirectCounterTakeoutDelivery",
                    e.target.checked
                  )
                }
                className="rounded border-surface-border mt-0.5"
              />
              <div className="space-y-0.5">
                <span className="font-semibold block">
                  Permitir entrega directa en mostrador (Takeout)
                </span>
                <p className="text-[11px] text-text-muted leading-tight">
                  Si está activo, el cajero puede entregar pedidos para llevar en un clic o marcarlos como listos. Si se desactiva, siempre deberá marcar Listo en Mostrador antes de entregar.
                </p>
              </div>
            </label>
          )}
        </div>
      </div>

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 space-y-4 shadow-xs transition-colors duration-200">
        <div className="flex items-center justify-between gap-3 border-b border-surface-border pb-2">
          <div>
            <h3 className="text-base font-black uppercase tracking-wide text-text-strong font-display">
              Cuentas Bancarias para Transferencias
            </h3>
            <p className="text-[11px] text-text-muted mt-0.5">
              Agrega una o varias cuentas bancarias o billeteras digitales (ej. Banco Pichincha, Guayaquil, Deuna).
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const currentAccounts: TenantBankDetailsDto[] =
                formState.bankAccounts && formState.bankAccounts.length > 0
                  ? formState.bankAccounts
                  : formState.bankDetails.bankName || formState.bankDetails.accountNumber
                    ? [formState.bankDetails]
                    : [];
              const nextAccounts: TenantBankDetailsDto[] = [
                ...currentAccounts,
                {
                  bankName: "",
                  accountType: "Cuenta Corriente",
                  accountNumber: "",
                  accountHolder: formState.businessName || formState.name || "",
                  taxId: formState.taxId || "",
                },
              ];
              onFieldChange("bankAccounts", nextAccounts);
              onFieldChange("bankDetails", nextAccounts[0]);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-brand-primary hover:bg-brand-primary-hover text-white font-bold text-[11px] uppercase tracking-wider font-display cursor-pointer shrink-0 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar Cuenta</span>
          </button>
        </div>

        {(() => {
          const accounts: TenantBankDetailsDto[] =
            formState.bankAccounts && formState.bankAccounts.length > 0
              ? formState.bankAccounts
              : formState.bankDetails.bankName || formState.bankDetails.accountNumber
                ? [formState.bankDetails]
                : [];

          const syncAccounts = (next: TenantBankDetailsDto[]) => {
            onFieldChange("bankAccounts", next);
            onFieldChange(
              "bankDetails",
              next[0] ?? {
                bankName: "",
                accountType: "",
                accountNumber: "",
                accountHolder: "",
                taxId: "",
              }
            );
          };

          if (accounts.length === 0) {
            return (
              <div className="py-6 text-center text-xs text-text-muted space-y-1">
                <p className="font-semibold text-text-strong">Sin cuentas bancarias registradas</p>
                <p>Haz clic en &ldquo;Agregar Cuenta&rdquo; para configurar tus datos de transferencia.</p>
              </div>
            );
          }

          return (
            <div className="space-y-4">
              {accounts.map((account, index) => (
                <div
                  key={index}
                  className="p-4 rounded-2xl bg-surface-canvas/50 border border-surface-border space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-text-strong">
                      Cuenta #{index + 1} {index === 0 ? "(Principal)" : ""}
                    </span>
                    <button
                      type="button"
                      onClick={() => syncAccounts(accounts.filter((_, i) => i !== index))}
                      title="Eliminar cuenta"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-text-muted hover:text-brand-primary cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1">
                        Entidad Bancaria
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Banco Pichincha, Guayaquil, Deuna"
                        value={account.bankName}
                        onChange={(e) => {
                          const next = accounts.map((item, i) =>
                            i === index ? { ...item, bankName: e.target.value } : item
                          );
                          syncAccounts(next);
                        }}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1">
                        Tipo de Cuenta
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Cuenta Corriente, Ahorros"
                        value={account.accountType}
                        onChange={(e) => {
                          const next = accounts.map((item, i) =>
                            i === index ? { ...item, accountType: e.target.value } : item
                          );
                          syncAccounts(next);
                        }}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1">
                        Número de Cuenta
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: 2100456789"
                        value={account.accountNumber}
                        onChange={(e) => {
                          const next = accounts.map((item, i) =>
                            i === index ? { ...item, accountNumber: e.target.value } : item
                          );
                          syncAccounts(next);
                        }}
                        className={`${inputClass} font-mono`}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1">
                        RUC / Cédula del Titular
                      </label>
                      <input
                        type="text"
                        placeholder="10 dígitos (Cédula) o 13 dígitos (RUC)"
                        value={account.taxId}
                        onChange={(e) => {
                          const next = accounts.map((item, i) =>
                            i === index ? { ...item, taxId: e.target.value } : item
                          );
                          syncAccounts(next);
                        }}
                        className={`${inputClass} font-mono`}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1">
                        Nombre del Titular de la Cuenta
                      </label>
                      <input
                        type="text"
                        placeholder="Nombre completo o razón social"
                        value={account.accountHolder}
                        onChange={(e) => {
                          const next = accounts.map((item, i) =>
                            i === index ? { ...item, accountHolder: e.target.value } : item
                          );
                          syncAccounts(next);
                        }}
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
