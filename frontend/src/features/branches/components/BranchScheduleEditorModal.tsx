"use client";

import React, { useState, useId } from "react";
import { Clock, X, Check, AlertCircle, Save, Power } from "lucide-react";
import type { BranchDetailDto } from "@/shared/types/api";
import { useUpdateBranchHoursMutation } from "@/features/tenant";
import { getBranchOperatingStatus } from "@/shared/lib/schedule";

interface BranchScheduleEditorModalProps {
  branch: BranchDetailDto | null;
  isOpen: boolean;
  onClose: () => void;
}

interface BranchScheduleFormProps {
  branch: BranchDetailDto;
  onClose: () => void;
}

function BranchScheduleForm({ branch, onClose }: BranchScheduleFormProps) {
  const [openingTime, setOpeningTime] = useState(branch.openingTime || "10:30");
  const [closingTime, setClosingTime] = useState(branch.closingTime || "21:30");
  const [isActive, setIsActive] = useState(branch.isActive ?? true);
  const [deliveryRadiusKm, setDeliveryRadiusKm] = useState<number | null>(
    branch.deliveryRadiusKm ?? 35
  );
  const [isCoverageStrict, setIsCoverageStrict] = useState(
    branch.isCoverageStrict ?? true
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const openingId = useId();
  const closingId = useId();

  const mutation = useUpdateBranchHoursMutation();
  const livePreview = getBranchOperatingStatus(openingTime, closingTime);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setSuccessMessage(null);

    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!timeRegex.test(openingTime)) {
      setValidationError("La hora de apertura debe tener formato HH:mm (ej. 10:30).");
      return;
    }
    if (!timeRegex.test(closingTime)) {
      setValidationError("La hora de cierre debe tener formato HH:mm (ej. 21:30).");
      return;
    }
    if (openingTime === closingTime) {
      setValidationError("La hora de cierre no puede ser idéntica a la de apertura.");
      return;
    }

    try {
      await mutation.mutateAsync({
        branchId: branch.id,
        data: {
          openingTime,
          closingTime,
          isActive,
          deliveryRadiusKm,
          isCoverageStrict,
        },
      });

      setSuccessMessage("Configuración operativa y zona de cobertura actualizadas correctamente.");
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al actualizar los horarios.";
      setValidationError(msg);
    }
  };

  return (
    <div className="bg-surface-card border border-surface-border rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
      {/* Cabecera del modal */}
      <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-surface-border flex items-center justify-between bg-surface-canvas shrink-0">
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          <div className="w-9 h-9 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2
              id="modal-schedule-title"
              className="font-display font-black text-base sm:text-lg uppercase tracking-wide text-text-strong truncate"
            >
              Horarios • {branch.name}
            </h2>
            <p className="text-[11px] text-text-muted truncate">
              Configuración operativa y disponibilidad en tiempo real
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-text-strong hover:bg-surface-card-hover transition-colors shrink-0 cursor-pointer"
          aria-label="Cerrar modal"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Contenido del formulario */}
      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1 overscroll-contain">
        {/* Alertas */}
        {validationError && (
          <div className="p-3 rounded-2xl bg-status-danger/10 border border-status-danger/30 text-status-danger text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-2xl bg-status-success/10 border border-status-success/30 text-status-success text-xs flex items-center gap-2.5">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Previsualización en vivo */}
        <div className="p-4 rounded-2xl bg-surface-canvas border border-surface-border space-y-1.5">
          <div className="flex items-center justify-between text-xs gap-2">
            <span className="text-text-muted font-medium">Estado resultante ahora:</span>
            <span
              className={`font-mono font-bold text-[11px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                !isActive
                  ? "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                  : livePreview.isOpen
                  ? "bg-status-success/20 text-status-success border border-status-success/40"
                  : "bg-surface-card text-text-muted border border-surface-border"
              }`}
            >
              {!isActive ? "En Mantenimiento" : livePreview.statusLabel}
            </span>
          </div>
          <p className="text-[11px] text-text-subtle">
            {!isActive
              ? "La sucursal está desactivada temporalmente; no admitirá órdenes."
              : livePreview.detailLabel}
          </p>
        </div>

        {/* Inputs de Horario */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label
              htmlFor={openingId}
              className="block text-xs font-bold uppercase tracking-wider text-text-strong mb-1.5 font-display"
            >
              Hora de Apertura
            </label>
            <input
              id={openingId}
              type="time"
              value={openingTime}
              onChange={(e) => setOpeningTime(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-surface-canvas border border-surface-border rounded-xl text-sm font-mono text-text-strong focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
            <span className="text-[10px] text-text-subtle mt-1 block">Formato 24h (HH:mm)</span>
          </div>

          <div>
            <label
              htmlFor={closingId}
              className="block text-xs font-bold uppercase tracking-wider text-text-strong mb-1.5 font-display"
            >
              Hora de Cierre
            </label>
            <input
              id={closingId}
              type="time"
              value={closingTime}
              onChange={(e) => setClosingTime(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-surface-canvas border border-surface-border rounded-xl text-sm font-mono text-text-strong focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
            <span className="text-[10px] text-text-subtle mt-1 block">Formato 24h (HH:mm)</span>
          </div>
        </div>

        {/* Toggle de Estado Activo */}
        <div className="pt-2 border-t border-surface-border flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-xs font-bold text-text-strong block font-display uppercase tracking-wider">
              Operación de la Sucursal
            </span>
            <span className="text-[11px] text-text-muted truncate block">
              {isActive ? "Disponible para pedidos y salón" : "Pausada temporalmente"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsActive((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shrink-0 min-h-[36px] ${
              isActive
                ? "bg-status-success/20 text-status-success border border-status-success/40"
                : "bg-surface-canvas text-text-muted border border-surface-border"
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{isActive ? "Activa" : "Pausada"}</span>
          </button>
        </div>

        {/* Configuración de Cobertura y Radio Haversine */}
        <div className="pt-2 border-t border-surface-border space-y-3">
          <span className="text-xs font-bold text-text-strong block font-display uppercase tracking-wider">
            Zona de Cobertura y Reparto (Haversine)
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-text-muted mb-1 uppercase tracking-wider">
                Radio de Cobertura (km)
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="200"
                value={deliveryRadiusKm ?? ""}
                placeholder="Ej. 35.0 (km)"
                onChange={(e) =>
                  setDeliveryRadiusKm(e.target.value ? Number(e.target.value) : null)
                }
                className="w-full px-3.5 py-2.5 bg-surface-canvas border border-surface-border rounded-xl text-sm font-mono font-bold text-text-strong focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
              <span className="text-[10px] text-text-subtle mt-1 block">
                Cálculo geodésico exacto desde la sede.
              </span>
            </div>

            <div className="flex flex-col justify-center">
              <label className="flex items-start gap-2.5 cursor-pointer text-text-strong mt-2">
                <input
                  type="checkbox"
                  checked={isCoverageStrict}
                  onChange={(e) => setIsCoverageStrict(e.target.checked)}
                  className="rounded border-surface-border mt-0.5"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold block">Cobertura Estricta</span>
                  <span className="text-[10px] text-text-muted block leading-tight">
                    Limita entregas al radio o polígono de esta sede.
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="pt-4 border-t border-surface-border flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={mutation.isPending}
            className="w-full sm:w-auto px-4 py-2.5 rounded-full text-xs font-bold text-text-muted hover:text-text-strong hover:bg-surface-canvas border border-surface-border sm:border-transparent transition-colors cursor-pointer min-h-[44px] text-center"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-black font-display uppercase tracking-wider rounded-full shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer min-h-[44px]"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{mutation.isPending ? "Guardando..." : "Guardar Horario"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export function BranchScheduleEditorModal({
  branch,
  isOpen,
  onClose,
}: BranchScheduleEditorModalProps) {
  if (!isOpen || !branch) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-schedule-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-neutral-950/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
    >
      <BranchScheduleForm key={branch.id} branch={branch} onClose={onClose} />
    </div>
  );
}
