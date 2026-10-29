import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "El correo electrónico es obligatorio.")
    .email("Formato de correo electrónico inválido.")
    .max(255, "El correo no puede exceder los 255 caracteres."),
  password: z
    .string()
    .min(1, "La contraseña es obligatoria.")
    .min(6, "La contraseña debe tener al menos 6 caracteres.")
    .max(100, "La contraseña no puede exceder los 100 caracteres."),
});

export type LoginFormData = z.infer<typeof loginSchema>;

