"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Loader2, X, AlertCircle, RotateCw } from "lucide-react";
import { WhatsAppIcon } from "@/shared/components/WhatsAppIcon";
import { useAuthStore } from "../store/useAuthStore";
import { useCurrentTenantQuery, useTenantStore } from "@/features/tenant";
import { resolveTenantRouting, useTenantRoutes } from "@/shared/lib/tenant-routing";
import { resolvePostLoginRedirect } from "../lib/redirectByRole";
import type { CreateWhatsAppChallengeResponse } from "../types";

interface WhatsAppSignInButtonProps {
  redirectUrl?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  mode?: "login" | "register";
}

function formatSeconds(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function WhatsAppSignInButton({
  redirectUrl,
  onSuccess,
  onError,
  mode = "login",
}: WhatsAppSignInButtonProps) {
  const router = useRouter();
  const { data: tenant } = useCurrentTenantQuery();
  const routes = useTenantRoutes(tenant?.slug);

  const createWhatsAppChallenge = useAuthStore((s) => s.createWhatsAppChallenge);
  const pollWhatsAppChallenge = useAuthStore((s) => s.pollWhatsAppChallenge);

  const [isOpen, setIsOpen] = useState(false);
  const [challenge, setChallenge] = useState<CreateWhatsAppChallengeResponse | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const isPollingRef = useRef(false);
  const completedRef = useRef(false);

  const activeTenantSlug = routes.isPlatformRoot
    ? undefined
    : (tenant?.slug || useTenantStore.getState().tenantSlug || undefined);

  const handleAuthenticatedSuccess = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setIsOpen(false);
    onSuccess?.();

    const loggedUser = useAuthStore.getState().user;
    if (loggedUser?.tenantSlug) {
      useTenantStore.getState().setTenantSlug(loggedUser.tenantSlug);
    }

    const resolvedSlug = loggedUser?.tenantSlug || activeTenantSlug || undefined;

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
  }, [activeTenantSlug, onSuccess, redirectUrl, router, tenant?.enableKitchenWorkflow]);

  const startChallenge = useCallback(async () => {
    setError(null);
    setIsExpired(false);
    setIsCreating(true);
    completedRef.current = false;

    try {
      const created = await createWhatsAppChallenge({
        tenantSlug: activeTenantSlug,
      });
      setChallenge(created);
      setRemainingSeconds(created.expiresInSeconds);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "No se pudo iniciar el acceso con WhatsApp.";
      setError(msg);
      onError?.(msg);
    } finally {
      setIsCreating(false);
    }
  }, [activeTenantSlug, createWhatsAppChallenge, onError]);

  const handleOpen = async () => {
    setIsOpen(true);
    await startChallenge();
  };

  const handleClose = () => {
    if (isCreating) return;
    setIsOpen(false);
    setChallenge(null);
    setError(null);
    setIsExpired(false);
  };

  // Temporizador regresivo de vigencia del código
  useEffect(() => {
    if (!isOpen || !challenge || isExpired || remainingSeconds <= 0) return;
    const timer = setTimeout(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [isOpen, challenge, isExpired, remainingSeconds]);

  // Sondeo ligero del estado del challenge + chequeo inmediato al volver de WhatsApp
  useEffect(() => {
    if (!isOpen || !challenge || isExpired) return;

    const checkStatus = async () => {
      if (isPollingRef.current || completedRef.current) return;
      isPollingRef.current = true;
      try {
        const res = await pollWhatsAppChallenge(challenge.challengeId, activeTenantSlug);
        if (res.status === "authenticated") {
          handleAuthenticatedSuccess();
        } else if (res.status === "expired") {
          setIsExpired(true);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : null;
        if (msg && msg.toLowerCase().includes("contraseña")) {
          setError(msg);
          setIsExpired(true);
        }
      } finally {
        isPollingRef.current = false;
      }
    };

    const interval = setInterval(() => {
      void checkStatus();
    }, 2500);

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        void checkStatus();
      }
    };

    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
    };
  }, [isOpen, challenge, isExpired, activeTenantSlug, pollWhatsAppChallenge, handleAuthenticatedSuccess]);

  return (
    <>
      {/* Botón Principal de Acceso con WhatsApp */}
      <button
        type="button"
        onClick={handleOpen}
        className="relative w-full max-w-[400px] mx-auto h-[40px] px-10 bg-[#25D366] hover:bg-[#20BD5A] active:scale-95 text-white font-medium text-sm font-sans rounded-full shadow-xs transition-all flex items-center justify-center cursor-pointer"
      >
        <WhatsAppIcon className="w-[18px] h-[18px] fill-current shrink-0 absolute left-3.5" />
        <span>
          {mode === "register" ? "Continuar con WhatsApp" : "Continuar con WhatsApp"}
        </span>
      </button>

      {/* Modal de Verificación Directa por WhatsApp (renderizado en Portal para evitar márgenes/transformaciones heredadas) */}
      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Entrar con WhatsApp"
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          >
            <div className="bg-surface-card border border-surface-border text-text-strong w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto overscroll-contain">
              {/* Cabecera del Modal */}
              <div className="relative flex items-center justify-center px-8">
                <div className="flex items-center gap-2">
                  <WhatsAppIcon className="w-5 h-5 text-[#25D366] fill-current shrink-0" />
                  <h3 className="font-display font-black text-lg uppercase tracking-tight text-text-strong leading-tight text-center">
                    Entrar con WhatsApp
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isCreating}
                  aria-label="Cerrar ventana"
                  className="absolute right-0 p-2 rounded-full hover:bg-surface-canvas text-text-subtle hover:text-text-strong transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Alerta de Error */}
              {error && (
                <div className="border border-surface-border bg-surface-canvas text-text-strong text-xs p-3.5 rounded-2xl flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-brand-primary mt-0.5" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              {/* Estado de Carga */}
              {isCreating ? (
                <div className="py-8 flex flex-col items-center justify-center gap-3 text-center">
                  <Loader2 className="w-7 h-7 animate-spin text-[#25D366]" />
                  <p className="text-xs text-text-muted">
                    Preparando acceso...
                  </p>
                </div>
              ) : challenge ? (
                <div className="space-y-4 text-center">
                  <p className="text-sm text-text-base leading-relaxed">
                    Abre WhatsApp, envía el mensaje prellenado y vuelve aquí para entrar.
                  </p>

                  {isExpired ? (
                    <div className="space-y-3 pt-1">
                      <p className="text-xs text-text-muted">
                        El enlace expiró. Genera uno nuevo para continuar.
                      </p>
                      <button
                        type="button"
                        onClick={() => void startChallenge()}
                        className="w-full min-h-[46px] px-4 py-2.5 bg-brand-primary hover:bg-brand-primary-hover active:scale-95 text-white font-bold text-sm uppercase tracking-wider font-display rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <RotateCw className="w-4 h-4" />
                        <span>Intentar de nuevo</span>
                      </button>
                    </div>
                  ) : (
                    <>
                      <a
                        href={challenge.whatsAppUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full min-h-[44px] px-5 py-2.5 bg-[#25D366] hover:bg-[#20BD5A] active:scale-95 text-white font-semibold text-sm font-sans rounded-full shadow-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                      >
                        <WhatsAppIcon className="w-5 h-5 fill-current shrink-0" />
                        <span>Abrir WhatsApp</span>
                      </a>

                      <div className="flex flex-col items-center gap-1 text-xs text-text-muted pt-1">
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#25D366]" />
                          <span>Esperando confirmación</span>
                        </span>
                        <span className="font-mono tabular-nums text-[11px] text-text-subtle">
                          {challenge.shortCode} · {formatSeconds(remainingSeconds)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => void startChallenge()}
                    className="w-full min-h-[46px] px-4 py-2.5 bg-brand-primary hover:bg-brand-primary-hover active:scale-95 text-white font-bold text-sm uppercase tracking-wider font-display rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RotateCw className="w-4 h-4" />
                    <span>Reintentar</span>
                  </button>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
