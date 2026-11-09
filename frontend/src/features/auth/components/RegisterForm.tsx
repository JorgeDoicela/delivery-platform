"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { registerSchema, type RegisterFormData } from "../schemas/registerSchema";
import { useAuthStore } from "../store/useAuthStore";
import { useCurrentTenantQuery, useTenantStore } from "@/features/tenant";
import { resolvePostLoginRedirect } from "../lib/redirectByRole";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { useTenantRoutes, resolveTenantRouting } from "@/shared/lib/tenant-routing";

interface RegisterFormProps {
  redirectUrl?: string;
  embedded?: boolean;
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export function RegisterForm({
  redirectUrl,
  embedded = false,
  onSuccess,
  onSwitchToLogin,
}: RegisterFormProps) {
  const router = useRouter();
  const registerAction = useAuthStore((s) => s.register);
  const { data: tenant } = useCurrentTenantQuery();
  const routes = useTenantRoutes(tenant?.slug);
  const brandName = tenant?.name || "La Granjita";
  const brandTagline = tenant?.tagline || "Asadero";
  const brandLogo = tenant?.logoUrl || "/images/shared/placeholders/logo-default.png";

  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setFormError(null);
    const activeTenantSlug = tenant?.slug || useTenantStore.getState().tenantSlug || undefined;

    const success = await registerAction({
      email: data.email,
      password: data.password,
      fullName: data.fullName,
      phone: data.phone,
      tenantSlug: activeTenantSlug,
    });

    if (success) {
      if (onSuccess) {
        onSuccess();
      }

      const loggedUser = useAuthStore.getState().user;
      const tenantSlug = loggedUser?.tenantSlug || activeTenantSlug || "la-granjita";
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
      router.push(destination);
      router.refresh();
    } else {
      const currentError = useAuthStore.getState().error;
      setFormError(
        currentError || "No se pudo completar el registro. Intenta de nuevo más tarde."
      );
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
              {brandTagline} • Registro de Cuenta
            </span>
            <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
              Crea tu cuenta de cliente para realizar pedidos y dar seguimiento satelital.
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

      {/* Correo Electrónico */}
      <div className="space-y-1.5">
        <label
          htmlFor="reg-email"
          className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider"
        >
          Correo Electrónico
        </label>
        <input
          id="reg-email"
          type="email"
          autoComplete="email"
          disabled={isSubmitting}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "reg-email-error" : undefined}
          {...register("email")}
          placeholder="usuario@dominio.com"
          className="w-full min-h-[46px] px-4 py-2 bg-neutral-50 border border-neutral-200 hover:border-neutral-300 focus:bg-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary focus:outline-none rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 transition-all disabled:opacity-50 shadow-2xs outline-none"
        />
        {errors.email && (
          <p id="reg-email-error" className="text-xs text-red-600 font-medium">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Contraseña */}
      <div className="space-y-1.5">
        <label
          htmlFor="reg-password"
          className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider"
        >
          Contraseña
        </label>
        <div className="relative">
          <input
            id="reg-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "reg-password-error" : undefined}
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
          <p id="reg-password-error" className="text-xs text-red-600 font-medium">
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Confirmar Contraseña */}
      <div className="space-y-1.5">
        <label
          htmlFor="reg-confirmPassword"
          className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider"
        >
          Confirmar Contraseña
        </label>
        <div className="relative">
          <input
            id="reg-confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby={errors.confirmPassword ? "reg-confirmPassword-error" : undefined}
            {...register("confirmPassword")}
            placeholder="Repite la contraseña"
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
          <p id="reg-confirmPassword-error" className="text-xs text-red-600 font-medium">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {/* Botón de Registro */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full min-h-[48px] bg-brand-primary hover:bg-brand-primary-hover active:scale-95 text-white font-black text-sm uppercase tracking-wider font-display rounded-full shadow-md shadow-brand-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer pt-0.5 mt-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-white" />
            <span>Creando Cuenta...</span>
          </>
        ) : (
          <span>Registrarme y Continuar</span>
        )}
      </button>

      <GoogleSignInButton redirectUrl={redirectUrl} />

      {/* Enlace alternativo para iniciar sesión */}
      <div className="pt-2 text-center border-t border-neutral-100">
        <p className="text-xs text-neutral-500 font-sans">
          ¿Ya tienes una cuenta registrada?{" "}
          {onSwitchToLogin ? (
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="font-bold text-brand-primary hover:underline cursor-pointer"
            >
              Inicia sesión aquí
            </button>
          ) : (
            <Link
              href={routes.getLoginHref({ tab: "login", redirect: redirectUrl })}
              className="font-bold text-brand-primary hover:underline"
            >
              Inicia sesión aquí
            </Link>
          )}
        </p>
      </div>
    </form>
  );
}

