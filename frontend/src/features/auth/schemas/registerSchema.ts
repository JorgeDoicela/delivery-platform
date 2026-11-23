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
      .min(1, "El número de teléfono es obligatorio.")
      .min(7, "El número de teléfono debe tener al menos 7 dígitos.")
      .max(15, "El número de teléfono no puede exceder 15 caracteres.")
      .regex(/^[0-9+ ]{7,15}$/, "Ingresa un número de teléfono válido (ej: 0987654321 o +593987654321)."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

