import { z } from "zod";

export const checkoutSchema = z.object({
  customerName: z
    .string()
    .min(3, "El nombre completo debe tener al menos 3 caracteres.")
    .max(100),
  customerPhone: z
    .string()
    .min(9, "El número de teléfono debe tener al menos 9 dígitos.")
    .max(15, "Número de teléfono no válido."),
  customerEmail: z.string().email("Correo electrónico no válido.").optional().or(z.literal("")),
  identificationType: z.enum(["CONSUMIDOR_FINAL", "CEDULA", "RUC"]),
  identificationNumber: z.string().min(10, "Mínimo 10 dígitos para identificación.").max(13),
  addressStreet: z
    .string()
    .min(5, "La dirección de entrega es obligatoria para el reparto.")
    .max(300),
  addressReference: z.string().max(300).optional(),
  deliveryLatitude: z.number().optional(),
  deliveryLongitude: z.number().optional(),
  deliveryType: z.number().int().min(1).max(2), // 1: Delivery, 2: Takeout
  paymentMethod: z.number().int().min(1).max(3), // 1: Cash, 2: Transfer, 3: Card
  cashAmountPaid: z.number().positive().optional(),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;
