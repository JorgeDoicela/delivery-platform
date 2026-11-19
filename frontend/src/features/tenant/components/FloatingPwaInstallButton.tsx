"use client";

import React, { useState } from "react";
import { ArrowDownToLine, Share, PlusSquare, X, Smartphone, CheckCircle2 } from "lucide-react";
import { usePwaInstall } from "../hooks/usePwaInstall";
import { useCurrentTenantQuery } from "../hooks/useTenantQueries";
import { useCartStore } from "@/features/cart";

export function FloatingPwaInstallButton() {
  const { isInstalled, isIos, hasPrompt, triggerInstall } = usePwaInstall();
  const { data: tenant } = useCurrentTenantQuery();
  const selectedBranchId = useCartStore((s) => s.branchId);
  const [showIosModal, setShowIosModal] = useState(false);
  const [isSuccessFeedback, setIsSuccessFeedback] = useState(false);

  // Si la aplicación ya está instalada en el dispositivo (modo standalone), no mostrar
  if (isInstalled) {
    return null;
  }

  const brandName = tenant?.name || "el restaurante";
  const matchedBranch =
    selectedBranchId && tenant?.branches
      ? tenant.branches.find((b) => b.id === selectedBranchId)
      : null;

  const appDisplayName = matchedBranch
    ? `${brandName} (${matchedBranch.name})`
    : brandName;

  const handleInstallClick = async () => {
    if (hasPrompt) {
      const accepted = await triggerInstall();
      if (accepted) {
        setIsSuccessFeedback(true);
        setTimeout(() => setIsSuccessFeedback(false), 3000);
      }
    } else if (isIos) {
      setShowIosModal(true);
    } else {
      // En navegadores de escritorio o Android donde el evento aún no se disparó
      setShowIosModal(true);
    }
  };

  return (
    <>
      <div className="relative group pointer-events-auto">
        <button
          type="button"
          onClick={handleInstallClick}
          aria-label={`Instalar aplicación de ${appDisplayName}`}
          title={`Instalar aplicación de ${appDisplayName}`}
          className="group flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 bg-surface-card/95 hover:bg-surface-card-hover text-text-strong hover:text-brand-primary rounded-full shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 focus:outline-hidden focus:ring-2 focus:ring-brand-primary/40 cursor-pointer shrink-0 border border-surface-border/90 hover:border-brand-primary/40 backdrop-blur-md"
        >
          {isSuccessFeedback ? (
            <CheckCircle2 className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-emerald-500 animate-scaleIn" />
          ) : (
            <ArrowDownToLine className="w-4 h-4 sm:w-4.5 sm:h-4.5 transition-transform duration-200 group-hover:translate-y-0.5" />
          )}
        </button>

        {/* Tooltip flotante en hover para escritorio */}
        <div
          role="tooltip"
          className="absolute right-full mr-2.5 top-1/2 -translate-y-1/2 hidden md:group-hover:flex items-center whitespace-nowrap px-2.5 py-1 rounded-lg bg-surface-card/95 backdrop-blur-md text-text-strong text-[11px] font-bold tracking-tight shadow-lg border border-surface-border pointer-events-none transition-opacity duration-200"
        >
          <span>Instalar App de {appDisplayName}</span>
          <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-surface-border" />
        </div>
      </div>

      {/* Modal / Sheet con instrucciones de instalación para iOS o navegadores sin prompt automático */}
      {showIosModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Instrucciones para instalar la app de ${appDisplayName}`}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-fadeIn"
        >
          <div className="bg-surface-card rounded-3xl border border-surface-border text-text-strong shadow-2xl max-w-sm w-full p-5 sm:p-6 space-y-4 animate-slideUp">
            <div className="flex items-center justify-between pb-2 border-b border-surface-border/60">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-brand-primary" />
                <h3 className="font-display font-black text-base uppercase tracking-tight text-text-strong">
                  Instalar Aplicación
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIosModal(false)}
                className="p-1 rounded-full text-text-muted hover:text-text-strong hover:bg-surface-card-hover transition-colors cursor-pointer"
                aria-label="Cerrar instrucciones"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-text-muted leading-relaxed">
              Instala la aplicación directa de <strong className="text-text-strong">{appDisplayName}</strong> en tu pantalla de inicio para pedir más rápido y sin intermediarios:
            </p>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-surface-canvas border border-surface-border">
                <div className="p-1.5 rounded-xl bg-surface-card text-brand-primary shrink-0">
                  <Share className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-text-strong">1. Toca &quot;Compartir&quot;</p>
                  <p className="text-[11px] text-text-muted">En la barra inferior de Safari o en el menú de opciones de tu navegador.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-surface-canvas border border-surface-border">
                <div className="p-1.5 rounded-xl bg-surface-card text-brand-primary shrink-0">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-text-strong">2. Selecciona &quot;Agregar a inicio&quot;</p>
                  <p className="text-[11px] text-text-muted">Desliza hacia abajo y presiona &quot;Agregar a pantalla de inicio&quot; o &quot;Instalar aplicación&quot;.</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIosModal(false)}
              className="w-full py-2.5 px-4 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white font-bold text-xs uppercase tracking-wider font-display transition-colors cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
