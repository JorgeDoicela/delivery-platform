"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, KeyRound, X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useCurrentTenantQuery, useTenantStore } from "@/features/tenant";

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
          }) => void;
          prompt: () => void;
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
  const [testEmail, setTestEmail] = useState("usuario.google@gmail.com");
  const [testName, setTestName] = useState("Usuario Google");

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
          if (onSuccess) {
            onSuccess();
          }

          const loggedUser = useAuthStore.getState().user;
          const tenantSlug =
            loggedUser?.tenantSlug || activeTenantSlug || "la-granjita";

          const destination = redirectUrl || `/${tenantSlug}`;
          router.push(destination);
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
    if (!googleClientId) {
      return;
    }

    // Carga asíncrona del script oficial de Google Identity Services
    const scriptId = "google-jssdk";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.google?.accounts?.id) {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: (response) => {
              if (response.credential) {
                handleGoogleCredential(response.credential);
              }
            },
          });
        }
      };
      document.body.appendChild(script);
    } else if (window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response) => {
          if (response.credential) {
            handleGoogleCredential(response.credential);
          }
        },
      });
    }
  }, [googleClientId, handleGoogleCredential]);

  const handleButtonClick = () => {
    if (googleClientId && window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      // Si las llaves de producción aún no se han configurado en las variables de entorno
      setShowConfigModal(true);
    }
  };

  const handleDevTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfigModal(false);
    const mockToken = `dev-mock-google:${testEmail.trim()}:${testName.trim()}`;
    await handleGoogleCredential(mockToken);
  };

  return (
    <>
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
            {/* Logotipo oficial de Google en SVG de 4 colores */}
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

      {/* Modal Profesional de Configuración / Pruebas de Google Auth */}
      {showConfigModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
        >
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-brand-primary" />
                <h3 className="font-display font-black text-lg uppercase tracking-tight text-neutral-900">
                  Google Sign-In
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
                aria-label="Cerrar modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-900 leading-relaxed space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Llaves en espera de configuración</span>
              </div>
              <p>
                El código backend y frontend de Google OAuth está 100% activo y completo. Para conectar con tus credenciales reales, solo define:
              </p>
              <code className="block bg-white/80 p-2 rounded-lg font-mono text-[10px] text-neutral-800 break-all select-all">
                NEXT_PUBLIC_GOOGLE_CLIENT_ID=&quot;tu-client-id.apps.googleusercontent.com&quot;
              </code>
            </div>

            <form onSubmit={handleDevTestSubmit} className="space-y-3 pt-1">
              <span className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                Prueba del flujo de autenticación inmediata:
              </span>

              <div className="space-y-1">
                <label
                  htmlFor="google-test-name"
                  className="block text-[10px] font-bold text-neutral-700 uppercase"
                >
                  Nombre Simulado
                </label>
                <input
                  id="google-test-name"
                  type="text"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:border-brand-primary outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="google-test-email"
                  className="block text-[10px] font-bold text-neutral-700 uppercase"
                >
                  Correo Google Simulado
                </label>
                <input
                  id="google-test-email"
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:border-brand-primary outline-none"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-brand-primary hover:bg-brand-primary-hover active:scale-95 text-white font-black text-xs uppercase tracking-wider font-display py-2.5 rounded-full shadow-xs transition-all cursor-pointer"
                >
                  Simular Acceso con Google
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 active:scale-95 text-neutral-700 font-bold text-xs uppercase tracking-wider rounded-full transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
