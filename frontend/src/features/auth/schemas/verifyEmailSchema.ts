import { z } from "zod";

export const verifyEmailSchema = z.object({
  token: z
    .string()
    .trim()
    .min(1, "El código o token de verificación es obligatorio.")
    .length(64, "El token de verificación debe contener exactamente 64 caracteres hexadecimales.")
    .regex(/^[a-fA-F0-9]{64}$/, "El token de verificación contiene caracteres no válidos."),
  email: z
    .string()
    .trim()
    .email("Ingresa un correo electrónico válido.")
    .optional()
    .or(z.literal("")),
});

export type VerifyEmailFormData = z.infer<typeof verifyEmailSchema>;

export const resendVerificationSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "El correo electrónico es obligatorio.")
    .email("Ingresa un correo electrónico válido."),
});

export type ResendVerificationFormData = z.infer<typeof resendVerificationSchema>;

