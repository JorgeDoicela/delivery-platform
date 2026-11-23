"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X, AlertCircle, ArrowLeft } from "lucide-react";
import { WhatsAppIcon } from "@/shared/components/WhatsAppIcon";
import { useAuthStore } from "../store/useAuthStore";
import { useCurrentTenantQuery, useTenantStore } from "@/features/tenant";
import { resolveTenantRouting, useTenantRoutes } from "@/shared/lib/tenant-routing";
import { resolvePostLoginRedirect } from "../lib/redirectByRole";

interface WhatsAppSignInButtonProps {
  redirectUrl?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function WhatsAppSignInButton({
  redirectUrl,
  onSuccess,
  onError,
}: WhatsAppSignInButtonProps) {
  const router = useRouter();
  const { data: tenant } = useCurrentTenantQuery();
  const routes = useTenantRoutes(tenant?.slug);

  const requestWhatsAppOtp = useAuthStore((s) => s.requestWhatsAppOtp);
  const verifyWhatsAppOtp = useAuthStore((s) => s.verifyWhatsAppOtp);

  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  // Contador regresivo para reenvío de código
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const activeTenantSlug = routes.isPlatformRoot
    ? undefined
    : (tenant?.slug || useTenantStore.getState().tenantSlug || undefined);

  const handleOpen = () => {
    setError(null);
    setCode("");
    setStep("phone");
    setIsOpen(true);
  };

  const handleClose = () => {
    if (isLoading) return;
    setIsOpen(false);
    setError(null);
  };

  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.length < 7) {
      setError("Por favor ingresa un número de teléfono celular válido.");
      return;
    }

    setIsLoading(true);
    try {
      await requestWhatsAppOtp({
        phone: cleanPhone,
        tenantSlug: activeTenantSlug,
      });
      setStep("code");
      setCountdown(60);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al solicitar código por WhatsApp.";
      setError(msg);
      onError?.(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanCode = code.trim();
    if (!cleanCode || cleanCode.length < 4) {
      setError("Por favor ingresa el código numérico completo recibido en WhatsApp.");
      return;
    }

    setIsLoading(true);
    try {
      const success = await verifyWhatsAppOtp({
        phone: phone.trim(),
        code: cleanCode,
        tenantSlug: activeTenantSlug,
      });

      if (success) {
        setIsOpen(false);
        onSuccess?.();

        const loggedUser = useAuthStore.getState().user;
        if (loggedUser?.tenantSlug) {
          useTenantStore.getState().setTenantSlug(loggedUser.tenantSlug);
        }

        const resolvedSlug =
          loggedUser?.tenantSlug || activeTenantSlug || undefined;

        const routing = resolveTenantRouting({
          explicitSlug: resolvedSlug,
          pathname: typeof window !== "undefined" ? window.location.pathname : "/",
          hostname: typeof window !== "undefined" ? window.location.hostname : undefined,
        });

        const destination = resolvePostLoginRedirect({
          user: loggedUser,
          redirectUrl,
          routing,
          useKitchenWorkflow: tenant?.enableKitchenWorkflow,
        });

        if (typeof window !== "undefined" && window.location.pathname === destination) {
          router.replace(destination);
        } else {
          router.push(destination);
        }
        router.refresh();
      } else {
        const authError = useAuthStore.getState().error;
        setError(authError || "El código ingresado es incorrecto o ha expirado.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al verificar código.";
      setError(msg);
      onError?.(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Botón Principal de Acceso con WhatsApp */}
      <button
        type="button"
        onClick={handleOpen}
        className="w-full min-h-[46px] px-4 py-2.5 bg-[#25D366] hover:bg-[#20BD5A] active:scale-95 text-white font-bold text-sm tracking-wide font-display rounded-full shadow-md shadow-[#25D366]/20 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
      >
        <WhatsAppIcon className="w-5 h-5 fill-current shrink-0" />
        <span>Ingresar con mi WhatsApp</span>
      </button>

      {/* Modal Interactivo de Verificación OTP */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
        >
          <div className="bg-surface-card border border-surface-border text-text-strong w-full max-w-sm rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 animate-scaleUp">
            {/* Cabecera del Modal */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#25D366]/15 text-[#25D366] flex items-center justify-center shrink-0">
                  <WhatsAppIcon className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h3 className="font-display font-black text-lg uppercase tracking-tight text-text-strong leading-tight">
                    {step === "phone" ? "Acceso con WhatsApp" : "Verifica tu Código"}
                  </h3>
                  <span className="text-[11px] text-text-subtle font-mono">
                    {step === "phone" ? "Sin contraseña" : "Código de 6 dígitos"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                aria-label="Cerrar ventana"
                className="p-1.5 rounded-full hover:bg-surface-canvas text-text-subtle hover:text-text-strong transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Alerta de Error */}
            {error && (
              <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 text-xs p-3 rounded-2xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Paso 1: Ingreso de Teléfono Celular */}
            {step === "phone" ? (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="wa-phone"
                    className="block text-[11px] font-bold text-text-base uppercase tracking-wider"
                  >
                    Número Celular de WhatsApp
                  </label>
                  <input
                    id="wa-phone"
                    type="tel"
                    autoFocus
                    required
                    disabled={isLoading}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ej: 0987654321 o +593987654321"
                    className="w-full min-h-[46px] px-4 py-2 bg-surface-canvas border border-surface-border hover:border-surface-border/80 focus:bg-surface-card focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366] rounded-xl text-sm text-text-strong placeholder:text-text-subtle transition-all outline-none"
                  />
                  <p className="text-[11px] text-text-muted leading-relaxed">
                    Te enviaremos un mensaje de WhatsApp con un código de seguridad para ingresar a tu cuenta.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full min-h-[46px] px-4 py-2.5 bg-[#25D366] hover:bg-[#20BD5A] active:scale-95 text-white font-bold text-sm tracking-wide font-display rounded-full shadow-md shadow-[#25D366]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Enviando Código...</span>
                    </>
                  ) : (
                    <span>Enviar Código por WhatsApp</span>
                  )}
                </button>
              </form>
            ) : (
              /* Paso 2: Ingreso del Código OTP */
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="wa-code"
                      className="block text-[11px] font-bold text-text-base uppercase tracking-wider"
                    >
                      Código de Seguridad
                    </label>
                    <button
                      type="button"
                      onClick={() => setStep("phone")}
                      disabled={isLoading}
                      className="text-[11px] text-brand-primary hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      <span>Cambiar número</span>
                    </button>
                  </div>
                  <input
                    id="wa-code"
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    required
                    maxLength={6}
                    disabled={isLoading}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    className="w-full min-h-[50px] px-4 py-2 bg-surface-canvas border border-surface-border hover:border-surface-border/80 focus:bg-surface-card focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366] rounded-xl text-center text-2xl font-black font-mono tracking-widest text-text-strong placeholder:text-text-subtle transition-all outline-none"
                  />
                  <p className="text-[11px] text-text-muted text-center leading-relaxed">
                    Revisa tu WhatsApp en el número <strong className="text-text-strong">{phone}</strong>.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || code.length < 4}
                  className="w-full min-h-[46px] px-4 py-2.5 bg-[#25D366] hover:bg-[#20BD5A] active:scale-95 text-white font-bold text-sm tracking-wide font-display rounded-full shadow-md shadow-[#25D366]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Verificando...</span>
                    </>
                  ) : (
                    <span>Verificar y Entrar</span>
                  )}
                </button>

                {/* Reenvío de código con contador */}
                <div className="text-center pt-1">
                  {countdown > 0 ? (
                    <span className="text-xs text-text-subtle">
                      ¿No lo recibiste? Reenviar en <strong className="font-mono">{countdown}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRequestOtp()}
                      disabled={isLoading}
                      className="text-xs font-bold text-[#25D366] hover:underline cursor-pointer disabled:opacity-50"
                    >
                      Reenviar código a mi WhatsApp
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
