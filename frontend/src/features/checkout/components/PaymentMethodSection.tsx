"use client";

import { useState } from "react";
import type { UseFormSetValue } from "react-hook-form";
import type { CheckoutFormData } from "../schemas/checkoutSchema";
import { Copy, Check, Banknote, ArrowLeftRight } from "lucide-react";
import { useCurrentTenantQuery } from "@/features/tenant";
import { useCartStore } from "@/features/cart";

interface PaymentMethodSectionProps {
  setValue: UseFormSetValue<CheckoutFormData>;
  selectedPaymentMethod: number;
}

function getTaxIdLabel(taxId?: string | null): string {
  const digits = (taxId || "").replace(/\D/g, "");
  if (digits.length === 10) return "Cédula";
  if (digits.length === 13) return "RUC";
  return "RUC / Cédula";
}

export function PaymentMethodSection({
  setValue,
  selectedPaymentMethod,
}: PaymentMethodSectionProps) {
  const tenantSlug = useCartStore((s) => s.tenantSlug);
  const { data: tenant } = useCurrentTenantQuery(tenantSlug);
  const bankAccounts =
    tenant?.bankAccounts && tenant.bankAccounts.length > 0
      ? tenant.bankAccounts
      : tenant?.bankDetails && (tenant.bankDetails.bankName || tenant.bankDetails.accountNumber)
        ? [tenant.bankDetails]
        : [];
  const acceptsCash = tenant?.acceptsCash ?? true;
  const acceptsBankTransfer = tenant?.acceptsBankTransfer ?? true;

  const [selectedAccountIndex, setSelectedAccountIndex] = useState(0);
  const [copiedAccount, setCopiedAccount] = useState(false);

  const activeAccount = bankAccounts[selectedAccountIndex] ?? bankAccounts[0] ?? null;

  const handleCopyAccount = (accountNumber: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(accountNumber);
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    }
  };

  const handleSelectPaymentMethod = (method: 1 | 2) => {
    setValue("paymentMethod", method);
    if (method === 1) {
      setValue("cashAmountPaid", undefined);
    }
  };

  const showSelector = acceptsCash && acceptsBankTransfer;
  const showBankDetails = acceptsBankTransfer && (selectedPaymentMethod === 2 || !acceptsCash);

  // Si el establecimiento solo acepta Efectivo, no mostramos selector redundante
  if (acceptsCash && !acceptsBankTransfer) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-text-strong font-display">
          {showSelector ? "Método de Pago" : "Pago por Transferencia / Deuna"}
        </h3>
        <p className="text-[11px] text-text-muted">
          {showSelector
            ? `Opciones habilitadas por ${tenant?.name || "el restaurante"}`
            : `Realiza tu transferencia y valida el comprobante con ${tenant?.name || "el restaurante"}`}
        </p>
      </div>

      {showSelector && (
        <div className="grid grid-cols-2 rounded-xl overflow-hidden border border-surface-border bg-surface-card">
          <button
            type="button"
            onClick={() => handleSelectPaymentMethod(1)}
            className={`py-2 px-2.5 sm:px-4 transition-colors flex flex-col items-center justify-center text-center gap-0.5 cursor-pointer border-r border-surface-border ${
              selectedPaymentMethod === 1
                ? "bg-brand-primary text-white"
                : "bg-surface-card text-text-strong hover:bg-surface-canvas"
            }`}
          >
            <span className="flex items-center justify-center gap-1.5 text-[11px] sm:text-xs font-bold font-display uppercase tracking-wide">
              <Banknote className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${selectedPaymentMethod === 1 ? "text-white" : "text-text-muted"}`} />
              <span className="truncate">Efectivo</span>
            </span>
            <span className={`text-[10px] leading-tight ${selectedPaymentMethod === 1 ? "text-white/85" : "text-text-muted"}`}>
              Al recibir o en caja
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectPaymentMethod(2)}
            className={`py-2 px-2.5 sm:px-4 transition-colors flex flex-col items-center justify-center text-center gap-0.5 cursor-pointer ${
              selectedPaymentMethod === 2
                ? "bg-brand-primary text-white"
                : "bg-surface-card text-text-strong hover:bg-surface-canvas"
            }`}
          >
            <span className="flex items-center justify-center gap-1.5 text-[11px] sm:text-xs font-bold font-display uppercase tracking-wide">
              <ArrowLeftRight className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${selectedPaymentMethod === 2 ? "text-white" : "text-text-muted"}`} />
              <span className="truncate">Transferencia / Deuna</span>
            </span>
            <span className={`text-[10px] leading-tight ${selectedPaymentMethod === 2 ? "text-white/85" : "text-text-muted"}`}>
              Valida tu comprobante
            </span>
          </button>
        </div>
      )}

      {/* Subsección Informativa: Transferencia Bancaria */}
      {showBankDetails && (
        <div className="p-3.5 bg-surface-canvas border border-surface-border/80 rounded-xl space-y-2.5 text-xs animate-in fade-in duration-200">
          <div className="flex items-center justify-between gap-2">
            <p className="font-bold uppercase tracking-wide font-display text-text-strong">
              Datos Bancarios ({tenant?.name}):
            </p>
            {activeAccount?.accountNumber && (
              <button
                type="button"
                onClick={() => handleCopyAccount(activeAccount.accountNumber)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-primary hover:underline cursor-pointer shrink-0"
              >
                {copiedAccount ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedAccount ? "Copiado" : "Copiar Cuenta"}</span>
              </button>
            )}
          </div>

          {bankAccounts.length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              {bankAccounts.map((acc, idx) => {
                const isSelected = idx === (selectedAccountIndex < bankAccounts.length ? selectedAccountIndex : 0);
                return (
                  <button
                    key={`${acc.bankName}-${acc.accountNumber}-${idx}`}
                    type="button"
                    onClick={() => {
                      setSelectedAccountIndex(idx);
                      setCopiedAccount(false);
                    }}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-brand-primary text-white"
                        : "bg-surface-card border border-surface-border text-text-base hover:text-text-strong"
                    }`}
                  >
                    {acc.bankName || `Cuenta ${idx + 1}`}
                  </button>
                );
              })}
            </div>
          )}

          {activeAccount ? (
            <div className="space-y-1 text-[11px] leading-relaxed text-text-strong">
              {activeAccount.bankName && (
                <p>
                  <span className="font-semibold text-text-muted">Banco:</span> {activeAccount.bankName}
                </p>
              )}
              {(activeAccount.accountType || activeAccount.accountNumber) && (
                <p>
                  <span className="font-semibold text-text-muted">Tipo & Número:</span>{" "}
                  {[activeAccount.accountType, activeAccount.accountNumber].filter(Boolean).join(" • ")}
                </p>
              )}
              {activeAccount.accountHolder && (
                <p>
                  <span className="font-semibold text-text-muted">Titular:</span> {activeAccount.accountHolder}
                </p>
              )}
              {activeAccount.taxId && (
                <p>
                  <span className="font-semibold text-text-muted">{getTaxIdLabel(activeAccount.taxId)}:</span>{" "}
                  {activeAccount.taxId}
                </p>
              )}
            </div>
          ) : (
            <p className="text-[11px] text-text-muted">
              Solicita los datos bancarios directamente al comercio al confirmar tu pedido.
            </p>
          )}

          <p className="text-[10px] text-text-muted pt-1.5 border-t border-surface-border/70">
            * Una vez confirmado tu pedido, podrás compartir el comprobante de transferencia al repartidor o directamente por WhatsApp.
          </p>
        </div>
      )}
    </div>
  );
}
