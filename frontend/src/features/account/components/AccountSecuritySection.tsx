"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Loader2, Check, AlertCircle } from "lucide-react";
import {
  changePasswordSchema,
  type ChangePasswordFormData,
} from "../schemas/accountSchemas";
import { useAccountStore } from "../store/useAccountStore";

export function AccountSecuritySection() {
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
    <div className="bg-surface-card border border-surface-border rounded-3xl p-6 md:p-8 space-y-6">
      <div className="border-b border-surface-border pb-4">
        <h2 className="text-lg font-black text-text-strong font-display uppercase tracking-tight">
          Seguridad y Acceso a la Cuenta
        </h2>
        <p className="text-xs text-text-muted mt-0.5">
          Actualiza tu clave periódicamente para proteger tu información de pedidos y facturación.
        </p>
      </div>

      {actionSuccessMessage && (
        <div className="flex items-start gap-3 p-4 bg-emerald-950/40 border border-emerald-800 text-emerald-200 rounded-2xl text-xs">
          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="font-medium">{actionSuccessMessage}</p>
        </div>
      )}

      {profileError && (
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-800 dark:text-red-300 rounded-2xl text-xs">
          <AlertCircle className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
          <p className="font-medium">{profileError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-text-base uppercase tracking-wider">
            Contraseña Actual *
          </label>
          <input
            type="password"
            {...register("currentPassword")}
            placeholder="••••••••"
            className="w-full px-4 py-3 rounded-2xl border border-surface-border bg-surface-canvas text-text-strong placeholder:text-text-subtle text-xs focus:outline-none focus:border-brand-primary"
          />
          {errors.currentPassword && (
            <p className="text-xs text-brand-primary font-semibold">
              {errors.currentPassword.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-text-base uppercase tracking-wider">
            Nueva Contraseña *
          </label>
          <input
            type="password"
            {...register("newPassword")}
            placeholder="Mínimo 8 caracteres, mayúscula y número"
            className="w-full px-4 py-3 rounded-2xl border border-surface-border bg-surface-canvas text-text-strong placeholder:text-text-subtle text-xs focus:outline-none focus:border-brand-primary"
          />
          {errors.newPassword && (
            <p className="text-xs text-brand-primary font-semibold">
              {errors.newPassword.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-text-base uppercase tracking-wider">
            Confirmar Nueva Contraseña *
          </label>
          <input
            type="password"
            {...register("confirmPassword")}
            placeholder="Repite la nueva contraseña"
            className="w-full px-4 py-3 rounded-2xl border border-surface-border bg-surface-canvas text-text-strong placeholder:text-text-subtle text-xs focus:outline-none focus:border-brand-primary"
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
    </div>
  );
}

