"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useCurrentTenantQuery, useTenantStore } from "@/features/tenant";
import { resolvePostLoginRedirect } from "../lib/redirectByRole";
import { resolveTenantRouting } from "@/shared/lib/tenant-routing";
import { GoogleDevAuthModal } from "./GoogleDevAuthModal";

interface GoogleSignInButtonProps {
  redirectUrl?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            use_fedcm_for_prompt?: boolean;
          }) => void;
          prompt: (
            notificationCallback?: (notification: {
              isNotDisplayed: () => boolean;
              isSkippedMoment: () => boolean;
              getNotDisplayedReason?: () => string;
              getSkippedReason?: () => string;
            }) => void
          ) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: string;
              size?: string;
              type?: string;
              text?: string;
              shape?: string;
              width?: number;
            }
          ) => void;
        };
      };
    };
  }
}

export function GoogleSignInButton({
  redirectUrl,
  onSuccess,
  onError,
}: GoogleSignInButtonProps) {
  const router = useRouter();
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const { data: tenant } = useCurrentTenantQuery();
  const [isLoading, setIsLoading] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [diagnosticReason, setDiagnosticReason] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState("jorge.doicela.molina@gmail.com");
  const [testName, setTestName] = useState("Jorge Doicela");
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const [hasGsiButton, setHasGsiButton] = useState(false);
  const hasInitializedRef = useRef(false);

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const handleGoogleCredential = useCallback(
    async (idToken: string) => {
      setIsLoading(true);
      try {
        const activeTenantSlug =
          tenant?.slug || useTenantStore.getState().tenantSlug || undefined;

        const success = await loginWithGoogle({
          idToken,
          tenantSlug: activeTenantSlug,
        });

        if (success) {
          const loggedUser = useAuthStore.getState().user;

          if (onSuccess) {
            onSuccess();
          }

          const tenantSlug =
            loggedUser?.tenantSlug || activeTenantSlug || "la-granjita";

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
          const storeError = useAuthStore.getState().error;
          const message = storeError || "No se pudo autenticar con Google.";
          if (onError) {
            onError(message);
          }
        }
      } finally {
        setIsLoading(false);
      }
    },
    [loginWithGoogle, tenant?.slug, redirectUrl, router, onSuccess, onError]
  );

  useEffect(() => {
    if (!googleClientId || hasInitializedRef.current) {
      return;
    }

    const scriptId = "google-jssdk";

    const initGsi = () => {
      if (window.google?.accounts?.id && !hasInitializedRef.current) {
        hasInitializedRef.current = true;
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          use_fedcm_for_prompt: true,
          callback: (response) => {
            if (response.credential) {
              handleGoogleCredential(response.credential);
            }
          },
        });

        if (googleBtnRef.current) {
          try {
            googleBtnRef.current.innerHTML = "";
            window.google.accounts.id.renderButton(googleBtnRef.current, {
              type: "standard",
              theme: "outline",
              size: "large",
              text: "continue_with",
              shape: "pill",
              width: 360,
            });
            setHasGsiButton(true);
          } catch {
            setHasGsiButton(false);
          }
        }
      }
    };

    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGsi;
      document.body.appendChild(script);
    } else {
      initGsi();
    }
  }, [googleClientId, handleGoogleCredential]);

  const handleButtonClick = () => {
    if (googleClientId && window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification) => {
        const notDisplayed = notification.isNotDisplayed();
        const skipped = notification.isSkippedMoment();
        const rawReason =
          notification.getNotDisplayedReason?.() ||
          notification.getSkippedReason?.() ||
          "desconocido";

        if (notDisplayed || skipped) {
          let explanation = `Google reportó: "${rawReason}".`;
          if (rawReason === "origin_mismatch") {
            explanation = "Google Cloud reporta 'origin_mismatch': Los servidores perimetrales de Google aún están propagando la lista de orígenes autorizados para este Client ID (suele tardar entre 5 y 20 minutos).";
          } else if (rawReason === "opt_out_or_no_session") {
            explanation = "No se detectó sesión activa de Google en este navegador (o estás en modo incógnito estricto sin cuentas activas).";
          } else if (rawReason === "suppressed_by_user") {
            explanation = "La ventana fue cerrada previamente y Google impone un enfriamiento temporal.";
          }
          setDiagnosticReason(explanation);
          setShowConfigModal(true);
        }
      });
    } else {
      setDiagnosticReason("El SDK de Google no ha finalizado de cargar o el Client ID no está configurado.");
      setShowConfigModal(true);
    }
  };

  const handleDevTestSubmit = async () => {
    setShowConfigModal(false);
    const mockToken = `dev-mock-google:${testEmail.trim()}:${testName.trim()}`;
    await handleGoogleCredential(mockToken);
  };

  return (
    <>
      <div className="w-full flex flex-col items-center justify-center space-y-2">
        {/* Contenedor del botón oficial de Google */}
        <div
          ref={googleBtnRef}
          className={`w-full flex justify-center items-center ${hasGsiButton ? "block" : "hidden"}`}
        />

        {/* Botón táctil nativo con diseño Mesafy como respaldo */}
        {!hasGsiButton && (
          <button
            type="button"
            onClick={handleButtonClick}
            disabled={isLoading}
            aria-label="Continuar con Google"
            className="w-full min-h-[48px] px-4 py-2.5 bg-white hover:bg-neutral-50 active:scale-95 border border-neutral-300 hover:border-neutral-400 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider font-display text-neutral-800 shadow-xs transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-neutral-600" />
                <span className="font-sans text-xs font-semibold normal-case">Conectando con Google...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 shrink-0"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Continuar con Google</span>
              </>
            )}
          </button>
        )}
      </div>

      <GoogleDevAuthModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        googleClientId={googleClientId}
        diagnosticReason={diagnosticReason}
        testName={testName}
        setTestName={setTestName}
        testEmail={testEmail}
        setTestEmail={setTestEmail}
        onSubmit={handleDevTestSubmit}
      />
    </>
  );
}

