"use client";

import { KeyRound, X, AlertCircle } from "lucide-react";

interface GoogleDevAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  googleClientId?: string;
  diagnosticReason: string | null;
  testName: string;
  setTestName: (name: string) => void;
  testEmail: string;
  setTestEmail: (email: string) => void;
  onSubmit: () => void;
}

export function GoogleDevAuthModal({
  isOpen,
  onClose,
  googleClientId,
  diagnosticReason,
  testName,
  setTestName,
  testEmail,
  setTestEmail,
  onSubmit,
}: GoogleDevAuthModalProps) {
  if (!isOpen) return null;

  return (
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
            onClick={onClose}
            className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-900 leading-relaxed space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              {googleClientId
                ? "Autorización de Origen Google Cloud"
                : "Llaves en espera de configuración"}
            </span>
          </div>
          {googleClientId ? (
            <p>
              Tu <strong>Client ID</strong> ya está conectado. Si Google aún no despliega la ventana en tu navegador, verifica haber agregado <code>http://localhost:3005</code> en <strong>Orígenes autorizados de JavaScript</strong> en Google Cloud Console (la propagación de Google suele demorar unos minutos).
            </p>
          ) : (
            <>
              <p>
                El código backend y frontend de Google OAuth está 100% activo. Para conectar con tus credenciales reales, define:
              </p>
              <code className="block bg-white/80 p-2 rounded-lg font-mono text-[10px] text-neutral-800 break-all select-all">
                NEXT_PUBLIC_GOOGLE_CLIENT_ID=&quot;tu-client-id.apps.googleusercontent.com&quot;
              </code>
            </>
          )}

          {diagnosticReason && (
            <div className="bg-white/90 border border-amber-300 rounded-xl p-2.5 font-mono text-[11px] text-amber-950 mt-1 leading-relaxed">
              <span className="font-bold block text-[10px] uppercase tracking-wider text-amber-900 mb-0.5">
                Diagnóstico Google Cloud en vivo:
              </span>
              {diagnosticReason}
            </div>
          )}
        </div>

        <div className="space-y-3 pt-1">
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
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onSubmit();
                }
              }}
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
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onSubmit();
                }
              }}
              className="w-full px-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:border-brand-primary outline-none"
              required
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onSubmit}
              className="flex-1 bg-brand-primary hover:bg-brand-primary-hover active:scale-95 text-white font-black text-xs uppercase tracking-wider font-display py-2.5 rounded-full shadow-xs transition-all cursor-pointer"
            >
              Simular Acceso con Google
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 active:scale-95 text-neutral-700 font-bold text-xs uppercase tracking-wider rounded-full transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

