"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { loginSchema, type LoginFormData } from "../schemas/loginSchema";
import { useAuthStore } from "../store/useAuthStore";
import { resolvePostLoginRedirect } from "../lib/redirectByRole";
import { useCurrentTenantQuery, useTenantStore } from "@/features/tenant";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { useTenantRoutes, resolveTenantRouting } from "@/shared/lib/tenant-routing";

interface LoginFormProps {
  redirectUrl?: string;
  embedded?: boolean;
  onSwitchToRegister?: () => void;
  onSwitchToForgotPassword?: () => void;
}

export function LoginForm({
  redirectUrl,
  embedded = false,
  onSwitchToRegister,
  onSwitchToForgotPassword,
}: LoginFormProps) {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const { data: tenant } = useCurrentTenantQuery();
  const routes = useTenantRoutes(tenant?.slug);
  const brandName = tenant?.name || "La Granjita";
  const brandTagline = tenant?.tagline || "Asadero";
  const brandLogo = tenant?.logoUrl || "/images/shared/placeholders/logo-default.png";
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setFormError(null);
    const success = await login(data);

    if (success) {
      const loggedUser = useAuthStore.getState().user;
      if (loggedUser?.tenantSlug) {
        useTenantStore.getState().setTenantSlug(loggedUser.tenantSlug);
      }

      const tenantSlug =
        loggedUser?.tenantSlug || useTenantStore.getState().tenantSlug || "la-granjita";

      const routing = resolveTenantRouting({
        explicitSlug: tenantSlug,
        pathname: typeof window !== "undefined" ? window.location.pathname : "/",
        hostname: typeof window !== "undefined" ? window.location.hostname : undefined,
      });

      const destination = resolvePostLoginRedirect({
        user: loggedUser,
        redirectUrl,
        routing,
      });

      if (
        typeof window !== "undefined" &&
        window.location.pathname === destination
      ) {
        router.replace(destination);
      } else {
        router.push(destination);
      }
      router.refresh();
    } else {
      const currentError = useAuthStore.getState().error;
      setFormError(
        currentError || "Credenciales inválidas o cuenta sin acceso operativo."
      );
    }
  };

  const containerClasses = embedded
    ? "space-y-5 w-full max-w-md mx-auto"
    : "space-y-6 w-full max-w-md bg-surface-card border border-surface-border text-text-strong rounded-3xl p-7 sm:p-9 shadow-xl shadow-black/10 mx-auto";

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className={containerClasses}>
      {/* Cabecera con Logotipo Oficial (solo en modo independiente no-embebido) */}
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
              {brandTagline} • Acceso al Sistema
            </span>
            <p className="text-xs text-text-muted mt-2 leading-relaxed">
              Ingresa tus credenciales para acceder a cocina KDS, pedidos y administración.
            </p>
          </div>
          <div className="border-t border-surface-border/60" />
        </>
      )}

      {/* Alerta Contextual de Error */}
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

      {/* Campo: Correo Electrónico */}
      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="block text-[11px] font-bold text-text-base uppercase tracking-wider"
        >
          Correo Electrónico
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          disabled={isSubmitting}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
          placeholder="usuario@dominio.com"
          className="w-full min-h-[48px] px-4 py-2.5 bg-surface-canvas border border-surface-border hover:border-surface-border/80 focus:bg-surface-card focus:border-brand-primary focus:ring-1 focus:ring-brand-primary focus:outline-none rounded-xl text-sm text-text-strong placeholder:text-text-subtle transition-all disabled:opacity-50 shadow-2xs outline-none"
        />
        {errors.email && (
          <p id="email-error" className="text-xs text-red-600 font-medium">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Campo: Contraseña con Visor Interactivo */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="password"
            className="block text-[11px] font-bold text-text-base uppercase tracking-wider"
          >
            Contraseña
          </label>
          {onSwitchToForgotPassword ? (
            <button
              type="button"
              onClick={onSwitchToForgotPassword}
              className="text-[11px] font-bold text-brand-primary hover:underline cursor-pointer"
            >
              ¿Olvidaste tu contraseña?
            </button>
          ) : (
            <Link
              href={routes.getLoginHref({ tab: "forgot-password", redirect: redirectUrl })}
              className="text-[11px] font-bold text-brand-primary hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          )}
        </div>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password")}
            placeholder="••••••••"
            className="w-full min-h-[48px] pl-4 pr-11 py-2.5 bg-surface-canvas border border-surface-border hover:border-surface-border/80 focus:bg-surface-card focus:border-brand-primary focus:ring-1 focus:ring-brand-primary focus:outline-none rounded-xl text-sm text-text-strong placeholder:text-text-subtle transition-all disabled:opacity-50 shadow-2xs outline-none"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-text-subtle hover:text-text-strong hover:bg-surface-card-hover transition-colors cursor-pointer"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4 stroke-[1.8]" />
            ) : (
              <Eye className="w-4 h-4 stroke-[1.8]" />
            )}
          </button>
        </div>
        {errors.password && (
          <p id="password-error" className="text-xs text-red-600 font-medium">
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Botón Canónico de Envío (Píldora Roja en Barlow Condensed, Cero SVG Decorativo) */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full min-h-[50px] bg-brand-primary hover:bg-brand-primary-hover active:scale-95 text-white font-black text-sm uppercase tracking-wider font-display rounded-full shadow-md shadow-brand-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer pt-0.5"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-white" />
            <span>Validando Credenciales...</span>
          </>
        ) : (
          <span>Acceder al Sistema</span>
        )}
      </button>

      <GoogleSignInButton redirectUrl={redirectUrl} />

      {/* Enlace alternativo para crear cuenta */}
      <div className="pt-2 text-center border-t border-surface-border/60">
        <p className="text-xs text-text-muted font-sans">
          ¿No tienes una cuenta aún?{" "}
          {onSwitchToRegister ? (
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="font-bold text-brand-primary hover:underline cursor-pointer"
            >
              Crear cuenta gratis
            </button>
          ) : (
            <Link
              href={routes.getRegisterHref({ redirect: redirectUrl })}
              className="font-bold text-brand-primary hover:underline"
            >
              Crear cuenta gratis
            </Link>
          )}
        </p>
      </div>
    </form>
  );
}
