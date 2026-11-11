"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircle,
  AlertCircle,
  Loader2,
  Mail,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import {
  resendVerificationSchema,
  type ResendVerificationFormData,
} from "../schemas/verifyEmailSchema";
import { useAuthStore } from "../store/useAuthStore";
import { useCurrentTenantQuery } from "@/features/tenant";
import { useTenantRoutes } from "@/shared/lib/tenant-routing";

interface VerifyEmailViewProps {
  initialToken?: string;
  initialEmail?: string;
  embedded?: boolean;
  onSwitchToLogin?: () => void;
}

export function VerifyEmailView({
  initialToken = "",
  initialEmail = "",
  onSwitchToLogin,
}: VerifyEmailViewProps) {
  const { data: tenant } = useCurrentTenantQuery();
  const routes = useTenantRoutes(tenant?.slug);
  const verifyEmailAction = useAuthStore((s) => s.verifyEmail);
  const resendVerificationAction = useAuthStore((s) => s.resendVerification);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [isVerifyingAuto, setIsVerifyingAuto] = useState<boolean>(Boolean(initialToken));
  const [autoVerifyError, setAutoVerifyError] = useState<string | null>(null);
  const [autoVerifySuccess, setAutoVerifySuccess] = useState<string | null>(null);
  const [verifiedEmail, setVerifiedEmail] = useState<string>(initialEmail);

  const [resendSuccessMessage, setResendSuccessMessage] = useState<string | null>(null);
  const [resendErrorMessage, setResendErrorMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [isPending, startTransition] = useTransition();

  // Cuenta regresiva de enfriamiento para reenvío
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Verificación automática si viene token en query params
  useEffect(() => {
    if (!initialToken) return;

    let isMounted = true;

    verifyEmailAction({
      token: initialToken,
      email: initialEmail || undefined,
    })
      .then((res) => {
        if (!isMounted) return;
        setAutoVerifySuccess(res.message);
        if (res.email) setVerifiedEmail(res.email);
        setIsVerifyingAuto(false);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        const msg =
          err instanceof Error
            ? err.message
            : "El enlace de activación es inválido o ya ha expirado.";
        setAutoVerifyError(msg);
        setIsVerifyingAuto(false);
      });

    return () => {
      isMounted = false;
    };
  }, [initialToken, initialEmail, verifyEmailAction]);

  // Formulario de reenvío de correo
  const {
    register: registerResend,
    handleSubmit: handleSubmitResend,
    formState: { errors: resendErrors, isSubmitting: isSubmittingResend },
  } = useForm<ResendVerificationFormData>({
    resolver: zodResolver(resendVerificationSchema),
    defaultValues: {
      email: initialEmail,
    },
  });

  const onResendSubmit = async (data: ResendVerificationFormData) => {
    setResendSuccessMessage(null);
    setResendErrorMessage(null);

    startTransition(async () => {
      try {
        const res = await resendVerificationAction({
          email: data.email,
          tenantSlug: tenant?.slug,
        });
        setResendSuccessMessage(res.message);
        setResendCooldown(60);
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : "No se pudo reenviar el enlace. Intenta nuevamente.";
        setResendErrorMessage(msg);
      }
    });
  };

  // Estado 1: Verificación automática en curso al abrir enlace del correo
  if (isVerifyingAuto) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
        <div className="space-y-1">
          <h3 className="text-lg font-black uppercase tracking-tight text-text-strong font-display">
            Confirmando cuenta
          </h3>
          <p className="text-xs text-text-muted">
            Validando tu correo electrónico...
          </p>
        </div>
      </div>
    );
  }

  // Estado 2: Verificación Exitosa
  if (autoVerifySuccess) {
    return (
      <div className="space-y-6 text-center py-4">
        <div className="w-14 h-14 rounded-full border border-surface-border bg-surface-canvas flex items-center justify-center mx-auto text-text-strong">
          <CheckCircle className="w-7 h-7 text-emerald-600" />
        </div>

        <div className="space-y-2">
          <h3 className="text-2xl font-black uppercase tracking-tight text-text-strong font-display">
            ¡Correo Confirmado!
          </h3>
          <p className="text-xs text-text-muted max-w-sm mx-auto leading-relaxed">
            {autoVerifySuccess}
          </p>
          {verifiedEmail && (
            <p className="text-xs font-mono font-bold text-text-strong">
              {verifiedEmail}
            </p>
          )}
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          {onSwitchToLogin ? (
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="w-full sm:w-auto bg-brand-primary hover:bg-brand-primary-hover active:scale-95 text-white font-black text-xs uppercase tracking-wider font-display px-6 py-3 rounded-full shadow-md transition-all inline-flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
            >
              <span>Acceder al Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <Link
              href={routes.getLoginHref()}
              className="w-full sm:w-auto bg-brand-primary hover:bg-brand-primary-hover active:scale-95 text-white font-black text-xs uppercase tracking-wider font-display px-6 py-3 rounded-full shadow-md transition-all inline-flex items-center justify-center gap-2 min-h-[44px]"
            >
              <span>Acceder al Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}

          <Link
            href={routes.getCatalogHref()}
            className="w-full sm:w-auto bg-surface-canvas hover:bg-surface-card-hover border border-surface-border active:scale-95 text-text-strong font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-full transition-colors inline-flex items-center justify-center min-h-[44px]"
          >
            Ver Menú
          </Link>
        </div>
      </div>
    );
  }

  // Estado 3: Solicitud / reenvío de enlace de activación sin fricción técnica
  return (
    <div className="space-y-5">
      {/* Alerta de error si el enlace previo expiró o fue inválido */}
      {autoVerifyError && (
        <div className="flex items-start gap-3 p-3.5 bg-surface-canvas border border-surface-border rounded-2xl text-xs text-text-strong">
          <AlertCircle className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Enlace no válido o expirado</p>
            <p className="text-text-muted">{autoVerifyError}</p>
          </div>
        </div>
      )}

      {/* Formulario de Reenvío de Enlace */}
      <form onSubmit={handleSubmitResend(onResendSubmit)} className="space-y-4">
        {resendSuccessMessage && (
          <div className="flex items-start gap-3 p-3.5 bg-neutral-900 border border-neutral-800 rounded-2xl text-xs text-white">
            <Mail className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="font-medium">{resendSuccessMessage}</p>
          </div>
        )}

        {resendErrorMessage && (
          <div className="flex items-start gap-3 p-3.5 bg-surface-canvas border border-surface-border rounded-2xl text-xs text-text-strong">
            <AlertCircle className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
            <p className="font-medium">{resendErrorMessage}</p>
          </div>
        )}

        <div className="space-y-1.5">
          <label
            htmlFor="resend-email-input"
            className="block text-xs font-bold text-text-base uppercase tracking-wider"
          >
            Correo Electrónico Registrado
          </label>
          <input
            id="resend-email-input"
            type="email"
            {...registerResend("email")}
            placeholder="tu-correo@dominio.com"
            className="w-full px-4 py-3 rounded-2xl bg-surface-canvas border border-surface-border focus:bg-surface-card focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary text-text-strong placeholder:text-text-subtle text-xs transition-all"
          />
          {resendErrors.email && (
            <p className="text-xs text-brand-primary font-semibold mt-1">
              {resendErrors.email.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmittingResend || isPending || resendCooldown > 0}
          className="w-full bg-brand-primary hover:bg-brand-primary-hover active:scale-[0.98] disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider font-display py-3.5 rounded-full shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
        >
          {isSubmittingResend || isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Enviando enlace...</span>
            </>
          ) : resendCooldown > 0 ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-white/70" />
              <span>Reintentar en {resendCooldown}s</span>
            </>
          ) : (
            <>
              <Mail className="w-4 h-4" />
              <span>Enviar Nuevo Enlace de Activación</span>
            </>
          )}
        </button>
      </form>

      {/* Enlace de regreso al login o a la cuenta */}
      <div className="text-center pt-2">
        {onSwitchToLogin ? (
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-xs text-text-muted hover:text-text-strong font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            {isAuthenticated ? "Volver a mi cuenta" : "Volver a Iniciar Sesión"}
          </button>
        ) : (
          <Link
            href={routes.getLoginHref()}
            className="text-xs text-text-muted hover:text-text-strong font-bold uppercase tracking-wider transition-colors"
          >
            {isAuthenticated ? "Volver a mi cuenta" : "Volver a Iniciar Sesión"}
          </Link>
        )}
      </div>
    </div>
  );
}
