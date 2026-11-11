"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "../schemas/forgotPasswordSchema";
import { useAuthStore } from "../store/useAuthStore";
import { useCurrentTenantQuery, useTenantStore } from "@/features/tenant";
import { useTenantRoutes } from "@/shared/lib/tenant-routing";

interface ForgotPasswordFormProps {
  redirectUrl?: string;
  embedded?: boolean;
  initialEmail?: string;
  onSwitchToLogin?: () => void;
}

export function ForgotPasswordForm({
  redirectUrl,
  embedded = false,
  initialEmail = "",
  onSwitchToLogin,
}: ForgotPasswordFormProps) {
  const forgotPasswordAction = useAuthStore((s) => s.forgotPassword);
  const { data: tenant } = useCurrentTenantQuery();
  const routes = useTenantRoutes(tenant?.slug);
  const brandName = tenant?.name || "La Granjita";
  const brandTagline = tenant?.tagline || "Asadero";
  const brandLogo = tenant?.logoUrl || "/images/shared/placeholders/logo-default.png";

  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: initialEmail,
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setFormError(null);
    setSuccessMessage(null);

    const activeTenantSlug = tenant?.slug || useTenantStore.getState().tenantSlug || undefined;

    const result = await forgotPasswordAction({
      email: data.email,
      tenantSlug: activeTenantSlug,
    });

    if (result.success) {
      setSuccessMessage(result.message);
    } else {
      setFormError(result.message);
    }
  };

  const containerClasses = embedded
    ? "space-y-5 w-full max-w-md mx-auto"
    : "space-y-6 w-full max-w-md bg-surface-card border border-surface-border text-text-strong rounded-3xl p-7 sm:p-9 shadow-xl shadow-black/10 mx-auto";

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className={containerClasses}>
      {/* Cabecera independiente */}
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
              className="text-3xl font-black text-text-strong uppercase tracking-tight font-display leading-none"
            >
              {brandName}
            </h1>
            <span className="text-[11px] font-bold text-text-subtle uppercase tracking-widest block mt-1 font-mono">
              {brandTagline} • Recuperación
            </span>
            <p className="text-xs text-text-muted mt-2 leading-relaxed">
              Ingresa tu correo para recibir un enlace seguro de restablecimiento.
            </p>
          </div>
          <div className="border-t border-surface-border/60" />
        </>
      )}

      {/* Alerta de Error */}
      {formError && (
        <div
          role="alert"
          aria-live="polite"
          className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 text-xs p-3.5 rounded-2xl flex items-start gap-2.5 animate-fadeIn"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
          <div className="leading-relaxed font-medium">{formError}</div>
        </div>
      )}

      {/* Pantalla de Éxito */}
      {successMessage ? (
        <div className="space-y-4 py-2 text-center animate-fadeIn">
          <div className="w-12 h-12 bg-surface-canvas border border-surface-border rounded-full flex items-center justify-center mx-auto text-text-strong">
            <CheckCircle2 className="w-6 h-6 stroke-[2.2] text-green-600" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-text-strong uppercase font-display tracking-tight">
              Revisa tu Correo
            </h3>
            <p className="text-xs text-text-muted leading-relaxed max-w-sm mx-auto">
              {successMessage}
            </p>
          </div>

          <div className="pt-3">
            {onSwitchToLogin ? (
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="w-full min-h-[44px] bg-surface-canvas hover:bg-surface-card-hover border border-surface-border text-text-strong font-bold text-xs uppercase tracking-wider rounded-full transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver a Iniciar Sesión</span>
              </button>
            ) : (
              <Link
                href={routes.getLoginHref({ redirect: redirectUrl })}
                className="w-full min-h-[44px] bg-surface-canvas hover:bg-surface-card-hover border border-surface-border text-text-strong font-bold text-xs uppercase tracking-wider rounded-full transition-colors inline-flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver a Iniciar Sesión</span>
              </Link>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Campo Correo Electrónico */}
          <div className="space-y-1.5">
            <label
              htmlFor="forgot-email"
              className="block text-[11px] font-bold text-text-base uppercase tracking-wider"
            >
              Correo Electrónico Registrado
            </label>
            <input
              id="forgot-email"
              type="email"
              autoComplete="email"
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "forgot-email-error" : undefined}
              {...register("email")}
              placeholder="usuario@dominio.com"
              className="w-full min-h-[48px] px-4 py-2.5 bg-surface-canvas border border-surface-border hover:border-surface-border/80 focus:bg-surface-card focus:border-brand-primary focus:ring-1 focus:ring-brand-primary focus:outline-none rounded-xl text-sm text-text-strong placeholder:text-text-subtle transition-all disabled:opacity-50 shadow-2xs outline-none"
            />
            {errors.email && (
              <p id="forgot-email-error" className="text-xs text-red-600 font-medium">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Botón de Envío */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[48px] bg-brand-primary hover:bg-brand-primary-hover active:scale-95 text-white font-black text-sm uppercase tracking-wider font-display rounded-full shadow-md shadow-brand-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer pt-0.5"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Enviando Instrucciones...</span>
              </>
            ) : (
              <span>Enviar Enlace de Recuperación</span>
            )}
          </button>

          {/* Enlace para volver */}
          <div className="pt-2 text-center border-t border-surface-border/60">
            {onSwitchToLogin ? (
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-xs font-bold text-text-muted hover:text-text-strong hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Recordé mi contraseña, iniciar sesión</span>
              </button>
            ) : (
              <Link
                href={routes.getLoginHref({ redirect: redirectUrl })}
                className="text-xs font-bold text-text-muted hover:text-text-strong hover:underline inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Recordé mi contraseña, iniciar sesión</span>
              </Link>
            )}
          </div>
        </>
      )}
    </form>
  );
}

