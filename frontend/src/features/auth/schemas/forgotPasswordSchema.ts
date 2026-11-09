import { z } from "zod";

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "El correo electrónico es obligatorio.")
    .email("Formato de correo electrónico inválido.")
    .max(150, "El correo no puede exceder los 150 caracteres."),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

