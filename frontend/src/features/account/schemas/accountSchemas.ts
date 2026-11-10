import { z } from "zod";

export const identificationTypeEnum = z.enum([
  "CEDULA",
  "RUC",
  "PASAPORTE",
  "CONSUMIDOR_FINAL",
]);

export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, "El nombre completo debe tener al menos 3 caracteres")
    .max(150, "El nombre no puede exceder 150 caracteres"),
  phone: z
    .string()
    .trim()
    .min(9, "El teléfono debe tener al menos 9 dígitos")
    .max(20, "El teléfono no puede exceder 20 caracteres")
    .regex(/^[+0-9\s-]+$/, "Formato de teléfono no válido"),
  identificationType: identificationTypeEnum.nullable().optional(),
  identificationNumber: z
    .string()
    .trim()
    .max(20, "El documento no puede exceder 20 caracteres")
    .nullable()
    .optional(),
});

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;

export const addressSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  label: z
    .string()
    .trim()
    .min(2, "La etiqueta es obligatoria (ej: Casa, Oficina)")
    .max(60, "Máximo 60 caracteres"),
  street: z
    .string()
    .trim()
    .min(4, "La calle principal es obligatoria")
    .max(150, "Máximo 150 caracteres"),
  secondaryStreet: z.string().trim().max(150).optional().nullable(),
  reference: z.string().trim().max(250).optional().nullable(),
  buildingNumber: z.string().trim().max(30).optional().nullable(),
  latitude: z
    .number()
    .min(-90, "Latitud fuera de rango")
    .max(90, "Latitud fuera de rango"),
  longitude: z
    .number()
    .min(-180, "Longitud fuera de rango")
    .max(180, "Longitud fuera de rango"),
  isDefault: z.boolean(),
});

export type AddressFormData = z.infer<typeof addressSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "La contraseña actual es requerida"),
    newPassword: z
      .string()
      .min(8, "La nueva contraseña debe tener al menos 8 caracteres")
      .regex(/[A-Z]/, "Debe contener al menos una letra mayúscula")
      .regex(/[0-9]/, "Debe contener al menos un número"),
    confirmPassword: z
      .string()
      .min(1, "Debes confirmar la nueva contraseña"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
