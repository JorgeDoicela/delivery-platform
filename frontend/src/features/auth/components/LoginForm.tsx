"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, AlertCircle } from "lucide-react";
import { loginSchema, type LoginFormData } from "../schemas/loginSchema";
import { useAuthStore } from "../store/useAuthStore";
import { useCurrentTenantQuery } from "@/features/tenant";

interface LoginFormProps {
  redirectUrl?: string;
  embedded?: boolean;
}

export function LoginForm({ redirectUrl, embedded = false }: LoginFormProps) {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const { data: tenant } = useCurrentTenantQuery();
  const brandName = tenant?.name || "La Granjita";
  const brandTagline = tenant?.tagline || "Asadero";
  const brandLogo = tenant?.logoUrl || "/images/identidad/logo.png";
  const [formError, setFormError] = useState<string | null>(null);

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
      const destination = redirectUrl || "/cocina";
      router.push(destination);
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
    : "space-y-6 w-full max-w-md bg-white border border-neutral-200 rounded-3xl p-7 sm:p-9 shadow-xl shadow-neutral-900/5 mx-auto";

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
              className="text-3xl font-black text-neutral-950 uppercase tracking-tight font-display leading-none"
            >
              {brandName}
            </h1>
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest block mt-1 font-mono">
              {brandTagline} • Acceso al Sistema
            </span>
            <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
              Ingresa tus credenciales para acceder a cocina KDS, pedidos y administración.
            </p>
          </div>
          <div className="border-t border-neutral-100" />
        </>
      )}

      {/* Alerta Contextual de Error */}
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

      {/* Campo: Correo Electrónico */}
      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider"
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
          className="w-full min-h-[48px] px-4 py-2.5 bg-neutral-50 border border-neutral-200 hover:border-neutral-300 focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 transition-all disabled:opacity-50"
        />
        {errors.email && (
          <p id="email-error" className="text-xs text-red-600 font-medium">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Campo: Contraseña */}
      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider"
        >
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          disabled={isSubmitting}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "password-error" : undefined}
          {...register("password")}
          placeholder="••••••••"
          className="w-full min-h-[48px] px-4 py-2.5 bg-neutral-50 border border-neutral-200 hover:border-neutral-300 focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 transition-all disabled:opacity-50"
        />
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
    </form>
  );
}
