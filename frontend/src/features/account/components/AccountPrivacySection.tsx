"use client";

import { useState } from "react";
import { MessageSquare, ShieldCheck, AlertCircle, Check } from "lucide-react";
import { useAccountStore } from "../store/useAccountStore";

export function AccountPrivacySection() {
  const profile = useAccountStore((s) => s.profile);
  const isSaving = useAccountStore((s) => s.isSaving);
  const actionSuccessMessage = useAccountStore((s) => s.actionSuccessMessage);
  const profileError = useAccountStore((s) => s.profileError);
  const updateConsent = useAccountStore((s) => s.updateConsent);

  const [consentEnabled, setConsentEnabled] = useState(
    Boolean(profile?.hasWhatsAppConsent)
  );

  const handleToggleConsent = async () => {
    const nextState = !consentEnabled;
    setConsentEnabled(nextState);
    const success = await updateConsent({ whatsAppConsent: nextState });
    if (!success) {
      setConsentEnabled(!nextState); // Rollback en caso de error
    }
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-3xl p-6 md:p-8 space-y-6">
      <div className="border-b border-neutral-100 pb-4">
        <h2 className="text-lg font-black text-neutral-900 font-display uppercase tracking-tight">
          Privacidad y Protección de Datos Personales (LOPDP)
        </h2>
        <p className="text-xs text-neutral-500 mt-0.5">
          Gestiona el tratamiento de tus datos personales y los canales de comunicación automatizados con pleno derecho de revocatoria.
        </p>
      </div>

      {actionSuccessMessage && (
        <div className="flex items-start gap-3 p-4 bg-neutral-900 text-white rounded-2xl text-xs">
          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="font-medium">{actionSuccessMessage}</p>
        </div>
      )}

      {profileError && (
        <div className="flex items-start gap-3 p-4 bg-neutral-50 border border-neutral-300 text-neutral-900 rounded-2xl text-xs">
          <AlertCircle className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
          <p className="font-medium">{profileError}</p>
        </div>
      )}

      {/* Control de WhatsApp */}
      <div className="border border-neutral-200 rounded-3xl p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-900 shrink-0 mt-0.5">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-neutral-900 font-display uppercase tracking-tight">
                Notificaciones y Asistente en WhatsApp
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed max-w-xl">
                Autorizo expresamente a la plataforma y a sus establecimientos gastronómicos a tratar mi número telefónico para enviarme actualizaciones en tiempo real del estado de mis pedidos, confirmaciones de despacho y asistencia operativa mediante mensajería instantánea.
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={consentEnabled}
            disabled={isSaving || !profile?.phone}
            onClick={handleToggleConsent}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-40 ${
              consentEnabled ? "bg-neutral-900" : "bg-neutral-200"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                consentEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {!profile?.phone && (
          <p className="text-xs text-brand-primary font-semibold">
            Debes registrar un número de teléfono en tu perfil para habilitar este canal.
          </p>
        )}

        <div className="pt-2 border-t border-neutral-100 flex items-center gap-2 text-[11px] text-neutral-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>
            Estado de consentimiento:{" "}
            <strong className="text-neutral-700">
              {consentEnabled ? "Otorgado y Activo" : "Inactivo / Revocado"}
            </strong>
          </span>
        </div>
      </div>

      {/* Términos y Marco Legal LOPDP */}
      <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-6 space-y-2 text-xs text-neutral-600 leading-relaxed">
        <h4 className="font-bold text-neutral-900 uppercase tracking-wider text-[11px]">
          Marco Normativo y Ejercicio de Derechos ARCO
        </h4>
        <p>
          En estricto cumplimiento de la Ley Orgánica de Protección de Datos Personales del Ecuador y estándares internacionales, tus datos no serán cedidos a terceros con fines publicitarios no autorizados. Puedes revocar este consentimiento en cualquier instante desactivando la casilla superior o mediante solicitud formal de supresión de datos.
        </p>
      </div>
    </div>
  );
}
