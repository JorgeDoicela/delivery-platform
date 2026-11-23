"use client";

import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Select, type SelectOption, PhoneNumberInput } from "@/shared/components";
import {
  updateProfileSchema,
  type UpdateProfileFormData,
} from "../schemas/accountSchemas";
import { useAccountStore } from "../store/useAccountStore";
import { useAuthStore, UserRole, isUserInRole } from "@/features/auth";
import { AlertBanner } from "@/shared/components";
import type { IdentificationType } from "../types";

const IDENTIFICATION_OPTIONS: SelectOption[] = [
  { value: "CEDULA", label: "Cédula de Identidad" },
  { value: "RUC", label: "R.U.C.", badge: "SRI" },
  { value: "PASAPORTE", label: "Pasaporte" },
  { value: "CONSUMIDOR_FINAL", label: "Consumidor Final" },
];

export function AccountProfileSection() {
  const user = useAuthStore((s) => s.user);
  const isStaffOrAdmin =
    isUserInRole(user, UserRole.SuperAdmin) ||
    isUserInRole(user, UserRole.TenantAdmin) ||
    isUserInRole(user, UserRole.BranchManager) ||
    isUserInRole(user, UserRole.KitchenStaff) ||
    isUserInRole(user, UserRole.Cashier) ||
    isUserInRole(user, UserRole.Driver);

  const profile = useAccountStore((s) => s.profile);
  const isSaving = useAccountStore((s) => s.isSaving);
  const profileError = useAccountStore((s) => s.profileError);
  const actionSuccessMessage = useAccountStore((s) => s.actionSuccessMessage);
  const updateProfile = useAccountStore((s) => s.updateProfile);

  const {
    register,
    handleSubmit,
    control,
    setValue,
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

  const identificationTypeValue = useWatch({
    control,
    name: "identificationType",
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
          {isStaffOrAdmin ? "Datos Personales" : "Datos Personales y de Facturación"}
        </h2>
        <p className="text-xs text-text-muted mt-0.5">
          {isStaffOrAdmin
            ? "Actualiza tu nombre y teléfono de contacto asociados a tu cuenta operativa."
            : "Configura tus datos para agilizar el despacho y la emisión de comprobantes fiscales electrónicos (SRI)."}
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
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <PhoneNumberInput
                label="Teléfono de Contacto"
                required
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={errors.phone?.message}
              />
            )}
          />

          {!isStaffOrAdmin && (
            <>
              {/* Tipo de Documento */}
              <div>
                <Select
                  label="Tipo de Identificación"
                  placeholder="Seleccionar tipo..."
                  options={IDENTIFICATION_OPTIONS}
                  value={identificationTypeValue || ""}
                  onChange={(val) =>
                    setValue("identificationType", (val || null) as IdentificationType, {
                      shouldValidate: true,
                    })
                  }
                  error={errors.identificationType?.message}
                />
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
            </>
          )}
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

