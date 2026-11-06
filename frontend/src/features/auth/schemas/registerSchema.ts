import { z } from "zod";

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(1, "El nombre completo es obligatorio.")
      .min(3, "El nombre debe tener al menos 3 caracteres.")
      .max(100, "El nombre no puede exceder los 100 caracteres."),
    email: z
      .string()
      .trim()
      .min(1, "El correo electrónico es obligatorio.")
      .email("Formato de correo electrónico inválido.")
      .max(150, "El correo no puede exceder los 150 caracteres."),
    phone: z
      .string()
      .trim()
      .min(1, "El teléfono celular es obligatorio.")
      .regex(/^[0-9+ ]{7,15}$/, "Ingresa un número de teléfono celular válido (mínimo 7 dígitos)."),
    password: z
      .string()
      .min(1, "La contraseña es obligatoria.")
      .min(6, "La contraseña debe tener al menos 6 caracteres.")
      .max(100, "La contraseña no puede exceder los 100 caracteres."),
    confirmPassword: z
      .string()
      .min(1, "Confirma tu contraseña."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

