"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, AlertCircle, CheckCircle2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { resetPasswordSchema, type ResetPasswordFormData } from "../schemas/resetPasswordSchema";
import { useAuthStore } from "../store/useAuthStore";
import { useCurrentTenantQuery, useTenantStore } from "@/features/tenant";
import { useTenantRoutes } from "@/shared/lib/tenant-routing";

interface ResetPasswordFormProps {
  redirectUrl?: string;
  embedded?: boolean;
  initialEmail?: string;
  initialToken?: string;
  onSwitchToLogin?: () => void;
}

export function ResetPasswordForm({
  redirectUrl,
  embedded = false,
  initialEmail = "",
  initialToken = "",
  onSwitchToLogin,
}: ResetPasswordFormProps) {
  const resetPasswordAction = useAuthStore((s) => s.resetPassword);
  const { data: tenant } = useCurrentTenantQuery();
  const routes = useTenantRoutes(tenant?.slug);
  const brandName = tenant?.name || "La Granjita";
  const brandTagline = tenant?.tagline || "Asadero";
  const brandLogo = tenant?.logoUrl || "/images/shared/placeholders/logo-default.png";

  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: initialEmail,
      token: initialToken,
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setFormError(null);
    const activeTenantSlug = tenant?.slug || useTenantStore.getState().tenantSlug || undefined;

    const result = await resetPasswordAction({
      email: data.email,
      token: data.token,
      newPassword: data.password,
      tenantSlug: activeTenantSlug,
    });

    if (result.success) {
      setSuccess(true);
    } else {
      setFormError(result.message);
    }
  };

  const containerClasses = embedded
    ? "space-y-4 w-full max-w-md mx-auto"
    : "space-y-5 w-full max-w-md bg-white border border-neutral-200 rounded-3xl p-7 sm:p-9 shadow-xl shadow-neutral-900/5 mx-auto";

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className={containerClasses}>
      {/* Cabecera en modo independiente */}
      {!embedded && (
        <>
          <div className="flex flex-col items-center text-center">
            <div className="relative w-14 h-14 mb-3 drop-shadow-sm">
              <Image
                src={brandLogo}
                alt={`Logo ${brandName}`}
                width={56}
                height={56}
                priority
                className="w-full h-full object-contain"
              />
            </div>
            <h1
              data-display-brand
              className="text-3xl font-black text-neutral-950 uppercase tracking-tight font-display leading-none"
            >
              {brandName}
            </h1>
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest block mt-1 font-mono">
              {brandTagline} • Nueva Contraseña
            </span>
            <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
              Ingresa el token de verificación recibido y define tu nueva contraseña.
            </p>
          </div>
          <div className="border-t border-neutral-100" />
        </>
      )}

      {/* Alerta de Error */}
      {formError && (
        <div
          role="alert"
          aria-live="polite"
          className="bg-red-50 border border-red-200 text-red-700 text-xs p-3.5 rounded-2xl flex items-start gap-2.5 animate-fadeIn"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
          <div className="leading-relaxed font-medium">{formError}</div>
        </div>
      )}

      {/* Estado Exitoso */}
      {success ? (
        <div className="space-y-4 py-2 text-center animate-fadeIn">
          <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto text-neutral-900">
            <CheckCircle2 className="w-6 h-6 stroke-[2.2] text-green-600" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-neutral-900 uppercase font-display tracking-tight">
              Contraseña Actualizada
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed max-w-sm mx-auto">
              Tu contraseña ha sido restablecida exitosamente. Todas las sesiones anteriores fueron cerradas por seguridad.
            </p>
          </div>

          <div className="pt-3">
            {onSwitchToLogin ? (
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="w-full min-h-[48px] bg-brand-primary hover:bg-brand-primary-hover active:scale-95 text-white font-black text-sm uppercase tracking-wider font-display rounded-full shadow-md shadow-brand-primary/20 transition-all flex items-center justify-center gap-2 cursor-pointer pt-0.5"
              >
                <span>Iniciar Sesión Ahora</span>
              </button>
            ) : (
              <Link
                href={routes.getLoginHref({ redirect: redirectUrl })}
                className="w-full min-h-[48px] bg-brand-primary hover:bg-brand-primary-hover active:scale-95 text-white font-black text-sm uppercase tracking-wider font-display rounded-full shadow-md shadow-brand-primary/20 transition-all flex items-center justify-center gap-2 pt-0.5"
              >
                <span>Iniciar Sesión Ahora</span>
              </Link>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Correo Electrónico */}
          <div className="space-y-1.5">
            <label
              htmlFor="reset-email"
              className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider"
            >
              Correo Electrónico
            </label>
            <input
              id="reset-email"
              type="email"
              autoComplete="email"
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "reset-email-error" : undefined}
              {...register("email")}
              placeholder="usuario@dominio.com"
              className="w-full min-h-[46px] px-4 py-2 bg-neutral-50 border border-neutral-200 hover:border-neutral-300 focus:bg-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary focus:outline-none rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 transition-all disabled:opacity-50 shadow-2xs outline-none"
            />
            {errors.email && (
              <p id="reset-email-error" className="text-xs text-red-600 font-medium">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Token / Código de Verificación */}
          <div className="space-y-1.5">
            <label
              htmlFor="reset-token"
              className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider"
            >
              Token o Código de Recuperación
            </label>
            <input
              id="reset-token"
              type="text"
              autoComplete="off"
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.token)}
              aria-describedby={errors.token ? "reset-token-error" : undefined}
              {...register("token")}
              placeholder="Pega el código o token recibido en tu correo"
              className="w-full min-h-[46px] px-4 py-2 bg-neutral-50 border border-neutral-200 hover:border-neutral-300 focus:bg-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary focus:outline-none rounded-xl text-xs font-mono text-neutral-900 placeholder:text-neutral-400 transition-all disabled:opacity-50 shadow-2xs outline-none"
            />
            {errors.token && (
              <p id="reset-token-error" className="text-xs text-red-600 font-medium">
                {errors.token.message}
              </p>
            )}
          </div>

          {/* Nueva Contraseña */}
          <div className="space-y-1.5">
            <label
              htmlFor="reset-password"
              className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider"
            >
              Nueva Contraseña
            </label>
            <div className="relative">
              <input
                id="reset-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? "reset-password-error" : undefined}
                {...register("password")}
                placeholder="Mínimo 6 caracteres"
                className="w-full min-h-[46px] pl-4 pr-11 py-2 bg-neutral-50 border border-neutral-200 hover:border-neutral-300 focus:bg-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary focus:outline-none rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 transition-all disabled:opacity-50 shadow-2xs outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 stroke-[1.8]" />
                ) : (
                  <Eye className="w-4 h-4 stroke-[1.8]" />
                )}
              </button>
            </div>
            {errors.password && (
              <p id="reset-password-error" className="text-xs text-red-600 font-medium">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Confirmar Contraseña */}
          <div className="space-y-1.5">
            <label
              htmlFor="reset-confirmPassword"
              className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider"
            >
              Confirmar Nueva Contraseña
            </label>
            <div className="relative">
              <input
                id="reset-confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.confirmPassword)}
                aria-describedby={errors.confirmPassword ? "reset-confirmPassword-error" : undefined}
                {...register("confirmPassword")}
                placeholder="Repite la nueva contraseña"
                className="w-full min-h-[46px] pl-4 pr-11 py-2 bg-neutral-50 border border-neutral-200 hover:border-neutral-300 focus:bg-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary focus:outline-none rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 transition-all disabled:opacity-50 shadow-2xs outline-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={showConfirmPassword ? "Ocultar contraseña" : "Ver contraseña"}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4 stroke-[1.8]" />
                ) : (
                  <Eye className="w-4 h-4 stroke-[1.8]" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p id="reset-confirmPassword-error" className="text-xs text-red-600 font-medium">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Botón de Acción */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[48px] bg-brand-primary hover:bg-brand-primary-hover active:scale-95 text-white font-black text-sm uppercase tracking-wider font-display rounded-full shadow-md shadow-brand-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer pt-0.5 mt-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Actualizando Contraseña...</span>
              </>
            ) : (
              <span>Restablecer Contraseña</span>
            )}
          </button>

          {/* Enlace de regreso */}
          <div className="pt-2 text-center border-t border-neutral-100">
            {onSwitchToLogin ? (
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-xs font-bold text-neutral-600 hover:text-neutral-900 hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Cancelar y volver al inicio de sesión</span>
              </button>
            ) : (
              <Link
                href={routes.getLoginHref({ redirect: redirectUrl })}
                className="text-xs font-bold text-neutral-600 hover:text-neutral-900 hover:underline inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Cancelar y volver al inicio de sesión</span>
              </Link>
            )}
          </div>
        </>
      )}
    </form>
  );
}

