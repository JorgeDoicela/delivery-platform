import { z } from "zod";

export const resetPasswordSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, "El correo electrónico es obligatorio.")
      .email("Formato de correo electrónico inválido."),
    token: z
      .string()
      .trim()
      .min(1, "El token de recuperación es obligatorio.")
      .min(8, "El token de recuperación no es válido."),
    password: z
      .string()
      .min(1, "La nueva contraseña es obligatoria.")
      .min(6, "La contraseña debe tener al menos 6 caracteres.")
      .max(100, "La contraseña no puede exceder los 100 caracteres."),
    confirmPassword: z
      .string()
      .min(1, "Confirma tu nueva contraseña."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

