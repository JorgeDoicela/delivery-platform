"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Check, AlertCircle } from "lucide-react";
import {
  updateProfileSchema,
  type UpdateProfileFormData,
} from "../schemas/accountSchemas";
import { useAccountStore } from "../store/useAccountStore";
import type { IdentificationType } from "../types";

export function AccountProfileSection() {
  const profile = useAccountStore((s) => s.profile);
  const isSaving = useAccountStore((s) => s.isSaving);
  const profileError = useAccountStore((s) => s.profileError);
  const actionSuccessMessage = useAccountStore((s) => s.actionSuccessMessage);
  const updateProfile = useAccountStore((s) => s.updateProfile);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      fullName: profile?.fullName || "",
      phone: profile?.phone || "",
      identificationType: (profile?.identificationType as IdentificationType) || null,
      identificationNumber: profile?.identificationNumber || "",
    },
    values: {
      fullName: profile?.fullName || "",
      phone: profile?.phone || "",
      identificationType: (profile?.identificationType as IdentificationType) || null,
      identificationNumber: profile?.identificationNumber || "",
    },
  });

  const onSubmit = async (data: UpdateProfileFormData) => {
    await updateProfile({
      fullName: data.fullName,
      phone: data.phone,
      identificationType: data.identificationType || null,
      identificationNumber: data.identificationNumber || null,
    });
  };

  return (
    <div className="bg-surface-card border border-surface-border rounded-3xl p-6 md:p-8 space-y-6">
      <div className="border-b border-surface-border pb-4">
        <h2 className="text-lg font-black text-text-strong font-display uppercase tracking-tight">
          Datos Personales y de Facturación
        </h2>
        <p className="text-xs text-text-muted mt-0.5">
          Configura tus datos para agilizar el despacho y la emisión de comprobantes fiscales electrónicos (SRI).
        </p>
      </div>

      {actionSuccessMessage && (
        <div className="flex items-start gap-3 p-4 bg-emerald-950/40 border border-emerald-800 text-emerald-200 rounded-2xl text-xs">
          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="font-medium">{actionSuccessMessage}</p>
        </div>
      )}

      {profileError && (
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-800 dark:text-red-300 rounded-2xl text-xs">
          <AlertCircle className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
          <p className="font-medium">{profileError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nombre completo */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-text-base uppercase tracking-wider">
              Nombre Completo *
            </label>
            <input
              type="text"
              {...register("fullName")}
              placeholder="Ej: Carlos Mendoza"
              className="w-full px-4 py-3 rounded-2xl border border-surface-border bg-surface-canvas text-text-strong placeholder:text-text-subtle focus:outline-none focus:border-brand-primary text-xs transition-colors"
            />
            {errors.fullName && (
              <p className="text-xs text-brand-primary font-semibold">
                {errors.fullName.message}
              </p>
            )}
          </div>

          {/* Teléfono */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-text-base uppercase tracking-wider">
              Teléfono de Contacto *
            </label>
            <input
              type="tel"
              {...register("phone")}
              placeholder="Ej: +593987654321"
              className="w-full px-4 py-3 rounded-2xl border border-surface-border bg-surface-canvas text-text-strong placeholder:text-text-subtle focus:outline-none focus:border-brand-primary text-xs transition-colors"
            />
            {errors.phone && (
              <p className="text-xs text-brand-primary font-semibold">
                {errors.phone.message}
              </p>
            )}
          </div>

          {/* Tipo de Documento */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-text-base uppercase tracking-wider">
              Tipo de Identificación
            </label>
            <select
              {...register("identificationType")}
              className="w-full px-4 py-3 rounded-2xl border border-surface-border bg-surface-canvas text-text-strong focus:outline-none focus:border-brand-primary text-xs transition-colors"
            >
              <option value="">Seleccionar tipo...</option>
              <option value="CEDULA">Cédula de Identidad</option>
              <option value="RUC">R.U.C.</option>
              <option value="PASAPORTE">Pasaporte</option>
              <option value="CONSUMIDOR_FINAL">Consumidor Final</option>
            </select>
          </div>

          {/* Número de documento */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-text-base uppercase tracking-wider">
              Número de Identificación
            </label>
            <input
              type="text"
              {...register("identificationNumber")}
              placeholder="Ej: 1712345678"
              className="w-full px-4 py-3 rounded-2xl border border-surface-border bg-surface-canvas text-text-strong placeholder:text-text-subtle focus:outline-none focus:border-brand-primary text-xs transition-colors"
            />
            {errors.identificationNumber && (
              <p className="text-xs text-brand-primary font-semibold">
                {errors.identificationNumber.message}
              </p>
            )}
          </div>
        </div>

        {/* Correo (de solo lectura por motivos de auditoría y verificación) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-text-subtle uppercase tracking-wider">
            Correo Electrónico (Registrado)
          </label>
          <input
            type="email"
            value={profile?.email || ""}
            disabled
            className="w-full px-4 py-3 rounded-2xl border border-surface-border bg-surface-canvas/60 text-text-subtle text-xs cursor-not-allowed"
          />
          <p className="text-[11px] text-text-subtle">
            Para modificar tu correo electrónico principal, contacta con el soporte del sistema.
          </p>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto bg-brand-primary hover:brightness-110 active:scale-95 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider font-display px-8 py-3.5 rounded-full shadow-sm transition-all flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Guardando Cambios...</span>
              </>
            ) : (
              <span>Guardar Información</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

