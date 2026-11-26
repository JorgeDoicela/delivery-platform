"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Loader2 } from "lucide-react";
import {
  changePasswordSchema,
  type ChangePasswordFormData,
} from "../schemas/accountSchemas";
import { useAccountStore } from "../store/useAccountStore";
import { PasskeySettingsSection } from "./PasskeySettingsSection";
import { AlertBanner } from "@/shared/components";

interface AccountSecuritySectionProps {
  allowCustomBilling?: boolean;
}

export function AccountSecuritySection({
  allowCustomBilling = true,
}: AccountSecuritySectionProps) {
  const isSaving = useAccountStore((s) => s.isSaving);
  const profileError = useAccountStore((s) => s.profileError);
  const actionSuccessMessage = useAccountStore((s) => s.actionSuccessMessage);
  const changePassword = useAccountStore((s) => s.changePassword);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    const success = await changePassword({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
      confirmPassword: data.confirmPassword,
    });

    if (success) {
      reset();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-black text-text-strong font-display uppercase tracking-tight">
          Seguridad y Acceso a la Cuenta
        </h2>
        <p className="text-xs sm:text-[13px] text-text-muted mt-1">
          {allowCustomBilling
            ? "Actualiza tu clave periódicamente para proteger tu información de pedidos y facturación."
            : "Actualiza tu clave periódicamente para proteger el acceso a tu cuenta y tus pedidos."}
        </p>
      </div>

      {actionSuccessMessage && (
        <AlertBanner variant="success">
          {actionSuccessMessage}
        </AlertBanner>
      )}

      {profileError && (
        <AlertBanner variant="error">
          {profileError}
        </AlertBanner>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
        <div className="space-y-1.5">
          <label
            htmlFor="security-current-password"
            className="block text-[11px] font-bold text-text-base uppercase tracking-wider"
          >
            Contraseña Actual <span className="text-brand-primary">*</span>
          </label>
          <input
            id="security-current-password"
            type="password"
            {...register("currentPassword")}
            placeholder="••••••••"
            className="w-full h-[46px] px-4 rounded-xl border border-surface-border bg-surface-canvas text-text-strong placeholder:text-text-subtle text-sm font-medium focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary focus:bg-surface-card transition-all"
          />
          {errors.currentPassword && (
            <p className="text-xs text-brand-primary font-semibold">
              {errors.currentPassword.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="security-new-password"
            className="block text-[11px] font-bold text-text-base uppercase tracking-wider"
          >
            Nueva Contraseña <span className="text-brand-primary">*</span>
          </label>
          <input
            id="security-new-password"
            type="password"
            {...register("newPassword")}
            placeholder="Mínimo 8 caracteres, mayúscula y número"
            className="w-full h-[46px] px-4 rounded-xl border border-surface-border bg-surface-canvas text-text-strong placeholder:text-text-subtle text-sm font-medium focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary focus:bg-surface-card transition-all"
          />
          {errors.newPassword && (
            <p className="text-xs text-brand-primary font-semibold">
              {errors.newPassword.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="security-confirm-password"
            className="block text-[11px] font-bold text-text-base uppercase tracking-wider"
          >
            Confirmar Nueva Contraseña <span className="text-brand-primary">*</span>
          </label>
          <input
            id="security-confirm-password"
            type="password"
            {...register("confirmPassword")}
            placeholder="Repite la nueva contraseña"
            className="w-full h-[46px] px-4 rounded-xl border border-surface-border bg-surface-canvas text-text-strong placeholder:text-text-subtle text-sm font-medium focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary focus:bg-surface-card transition-all"
          />
          {errors.confirmPassword && (
            <p className="text-xs text-brand-primary font-semibold">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto bg-brand-primary hover:brightness-110 active:scale-95 text-white font-black text-xs uppercase tracking-wider font-display px-8 py-3.5 rounded-full shadow-sm min-h-[44px] inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Actualizando Contraseña...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Actualizar Contraseña</span>
              </>
            )}
          </button>
        </div>
      </form>

      <PasskeySettingsSection />
    </div>
  );
}

