"use client";

import { useState } from "react";
import type { UseFormSetValue } from "react-hook-form";
import type { CheckoutFormData } from "../schemas/checkoutSchema";
import { Copy, Check } from "lucide-react";
import { useCurrentTenantQuery } from "@/features/tenant";
import { useCartStore } from "@/features/cart";

interface PaymentMethodSectionProps {
  setValue: UseFormSetValue<CheckoutFormData>;
  selectedPaymentMethod: number;
}

export function PaymentMethodSection({
  setValue,
  selectedPaymentMethod,
}: PaymentMethodSectionProps) {
  const tenantSlug = useCartStore((s) => s.tenantSlug);
  const { data: tenant } = useCurrentTenantQuery(tenantSlug);
  const bankDetails = tenant?.bankDetails;
  const acceptsCash = tenant?.acceptsCash ?? true;
  const acceptsBankTransfer = tenant?.acceptsBankTransfer ?? true;

  const [copiedAccount, setCopiedAccount] = useState(false);

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

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-text-strong font-display">
          Método de Pago
        </h3>
        <p className="text-[11px] text-text-muted">
          Opciones habilitadas por {tenant?.name || "el restaurante"}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {acceptsCash && (
          <button
            type="button"
            onClick={() => handleSelectPaymentMethod(1)}
            className={`p-3.5 rounded-xl border text-left text-xs transition-all flex items-start gap-3 cursor-pointer ${
              selectedPaymentMethod === 1
                ? "border-brand-primary bg-surface-card ring-1 ring-brand-primary shadow-xs"
                : "border-surface-border hover:border-surface-border-subtle bg-surface-canvas/50"
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                selectedPaymentMethod === 1
                  ? "border-brand-primary bg-brand-primary"
                  : "border-surface-border bg-white"
              }`}
            >
              {selectedPaymentMethod === 1 && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-text-strong font-display uppercase tracking-wide">
                Efectivo contra Entrega
              </p>
              <p className="text-[11px] text-text-muted mt-0.5 leading-snug">
                Paga en efectivo al recibir tu pedido o retirar en caja.
              </p>
            </div>
          </button>
        )}

        {acceptsBankTransfer && (
          <button
            type="button"
            onClick={() => handleSelectPaymentMethod(2)}
            className={`p-3.5 rounded-xl border text-left text-xs transition-all flex items-start gap-3 cursor-pointer ${
              selectedPaymentMethod === 2
                ? "border-brand-primary bg-surface-card ring-1 ring-brand-primary shadow-xs"
                : "border-surface-border hover:border-surface-border-subtle bg-surface-canvas/50"
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                selectedPaymentMethod === 2
                  ? "border-brand-primary bg-brand-primary"
                  : "border-surface-border bg-white"
              }`}
            >
              {selectedPaymentMethod === 2 && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-text-strong font-display uppercase tracking-wide">
                Transferencia / Deuna
              </p>
              <p className="text-[11px] text-text-muted mt-0.5 leading-snug">
                Transfiere y valida el comprobante directamente con caja.
              </p>
            </div>
          </button>
        )}
      </div>

      {/* Subsección Informativa: Transferencia Bancaria */}
      {selectedPaymentMethod === 2 && (
        <div className="p-3.5 bg-surface-canvas border border-surface-border/80 rounded-xl space-y-2 text-xs animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <p className="font-bold uppercase tracking-wide font-display text-text-strong">
              Datos Bancarios ({tenant?.name}):
            </p>
            {bankDetails?.accountNumber && (
              <button
                type="button"
                onClick={() => handleCopyAccount(bankDetails.accountNumber)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-primary hover:underline cursor-pointer"
              >
                {copiedAccount ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedAccount ? "Copiado" : "Copiar Cuenta"}</span>
              </button>
            )}
          </div>
          <div className="space-y-1 text-[11px] leading-relaxed text-text-strong">
            <p><span className="font-semibold text-text-muted">Banco:</span> {bankDetails?.bankName || "Banco Pichincha"}</p>
            <p><span className="font-semibold text-text-muted">Tipo & Número:</span> {bankDetails?.accountType || "Cta. Corriente"} • {bankDetails?.accountNumber || "2100456789"}</p>
            <p><span className="font-semibold text-text-muted">Titular:</span> {bankDetails?.accountHolder || tenant?.businessName || tenant?.name}</p>
            <p><span className="font-semibold text-text-muted">RUC:</span> {bankDetails?.taxId || tenant?.taxId || "1754455341001"}</p>
          </div>
          <p className="text-[10px] text-text-muted pt-1 border-t border-status-info-border/50">
            * Una vez confirmado tu pedido, podrás compartir el comprobante de transferencia al repartidor o directamente por WhatsApp.
          </p>
        </div>
      )}
    </div>
  );
}
