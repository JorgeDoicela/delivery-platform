"use client";

import { useState } from "react";
import { MessageSquare, ShieldCheck } from "lucide-react";
import { useAccountStore } from "../store/useAccountStore";
import { AlertBanner } from "@/shared/components";

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
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-black text-text-strong font-display uppercase tracking-tight">
          Privacidad y Protección de Datos Personales (LOPDP)
        </h2>
        <p className="text-xs sm:text-[13px] text-text-muted mt-1">
          Gestiona el tratamiento de tus datos personales y los canales de comunicación automatizados con pleno derecho de revocatoria.
        </p>
      </div>

      {actionSuccessMessage && (
        <AlertBanner variant="success">
          {actionSuccessMessage}
        </AlertBanner>
      )}

      {profileError && (
        <AlertBanner variant="error">
          {profileError}
        </AlertBanner>
      )}

      {/* Control de WhatsApp */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <MessageSquare className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-black text-text-strong font-display uppercase tracking-tight">
                Notificaciones y Asistente en WhatsApp
              </h3>
              <p className="text-xs sm:text-[13px] text-text-muted leading-relaxed max-w-2xl">
                Autorizo expresamente a la plataforma y a sus establecimientos gastronómicos a tratar mi número telefónico para enviarme actualizaciones en tiempo real del estado de mis pedidos, confirmaciones de despacho y asistencia operativa mediante mensajería instantánea.
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={consentEnabled}
            aria-label="Activar notificaciones y asistente en WhatsApp"
            disabled={isSaving || !profile?.phone}
            onClick={handleToggleConsent}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
              consentEnabled ? "bg-brand-primary" : "bg-neutral-300 dark:bg-neutral-700"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                consentEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {!profile?.phone && (
          <p className="text-xs text-brand-primary font-semibold pl-8">
            Debes registrar un número de teléfono en tu perfil para habilitar este canal.
          </p>
        )}

        <div className="flex items-center gap-2 text-xs text-text-muted pl-8">
          <ShieldCheck className="w-4 h-4 text-text-subtle shrink-0" />
          <span>
            Estado de consentimiento:{" "}
            <strong className="text-text-strong">
              {consentEnabled ? "Otorgado y Activo" : "Inactivo / Revocado"}
            </strong>
          </span>
        </div>
      </div>

      {/* Términos y Marco Legal LOPDP */}
      <div className="pt-6 border-t border-surface-border space-y-2 text-xs sm:text-[13px] text-text-muted leading-relaxed">
        <h4 className="font-bold text-text-strong uppercase tracking-wider text-[11px]">
          Marco Normativo y Ejercicio de Derechos ARCO
        </h4>
        <p className="max-w-3xl">
          En estricto cumplimiento de la Ley Orgánica de Protección de Datos Personales del Ecuador y estándares internacionales, tus datos no serán cedidos a terceros con fines publicitarios no autorizados. Puedes revocar este consentimiento en cualquier instante desactivando la casilla superior o mediante solicitud formal de supresión de datos.
        </p>
      </div>
    </div>
  );
}
