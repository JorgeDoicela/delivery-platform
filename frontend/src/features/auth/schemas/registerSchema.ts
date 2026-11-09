import { z } from "zod";

export const registerSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, "El correo electrónico es obligatorio.")
      .email("Formato de correo electrónico inválido.")
      .max(150, "El correo no puede exceder los 150 caracteres."),
    password: z
      .string()
      .min(1, "La contraseña es obligatoria.")
      .min(6, "La contraseña debe tener al menos 6 caracteres.")
      .max(100, "La contraseña no puede exceder los 100 caracteres."),
    confirmPassword: z
      .string()
      .min(1, "Confirma tu contraseña."),
    fullName: z
      .string()
      .trim()
      .max(100, "El nombre no puede exceder los 100 caracteres.")
      .optional(),
    phone: z
      .string()
      .trim()
      .optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

