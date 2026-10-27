import { describe, it, expect } from "vitest";
import { checkoutSchema } from "./checkoutSchema";

describe("checkoutSchema", () => {
  const validData = {
    customerName: "Juan Perez",
    customerPhone: "0991234567",
    customerEmail: "juan.perez@example.com",
    identificationType: "CONSUMIDOR_FINAL" as const,
    identificationNumber: "9999999999999",
    addressStreet: "Av. Amazonas y Naciones Unidas",
    addressReference: "Junto al parque La Carolina",
    deliveryLatitude: -0.1782,
    deliveryLongitude: -78.4845,
    deliveryType: 1, // Delivery
    paymentMethod: 1, // Cash
    cashAmountPaid: 30,
  };

  it("debe validar correctamente un formulario con datos completos y validos", () => {
    const result = checkoutSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("debe validar correctamente si el email se omite o es cadena vacia", () => {
    const withoutEmail = { ...validData, customerEmail: "" };
    expect(checkoutSchema.safeParse(withoutEmail).success).toBe(true);

    const undefinedEmail = { ...validData, customerEmail: undefined };
    expect(checkoutSchema.safeParse(undefinedEmail).success).toBe(true);
  });

  it("debe rechazar un email con formato invalido", () => {
    const invalidEmail = { ...validData, customerEmail: "correo-invalido" };
    const result = checkoutSchema.safeParse(invalidEmail);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("customerEmail");
    }
  });

  it("debe rechazar nombres de cliente menores a 3 caracteres", () => {
    const shortName = { ...validData, customerName: "Ab" };
    const result = checkoutSchema.safeParse(shortName);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("customerName");
    }
  });

  it("debe rechazar telefonos menores a 9 digitos", () => {
    const shortPhone = { ...validData, customerPhone: "12345" };
    const result = checkoutSchema.safeParse(shortPhone);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("customerPhone");
    }
  });

  it("debe rechazar direcciones de entrega menores a 5 caracteres", () => {
    const shortAddress = { ...validData, addressStreet: "Casa" };
    const result = checkoutSchema.safeParse(shortAddress);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("addressStreet");
    }
  });

  it("debe rechazar tipos de identificacion no reconocidos", () => {
    const invalidIdType = { ...validData, identificationType: "PASAPORTE" as unknown as "CONSUMIDOR_FINAL" };
    const result = checkoutSchema.safeParse(invalidIdType);
    expect(result.success).toBe(false);
  });

  it("debe rechazar numeros de identificacion menores a 10 digitos", () => {
    const shortIdNumber = { ...validData, identificationNumber: "12345" };
    const result = checkoutSchema.safeParse(shortIdNumber);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("identificationNumber");
    }
  });

  it("debe rechazar deliveryType fuera del rango permitido (1 a 2)", () => {
    const invalidDeliveryType = { ...validData, deliveryType: 3 };
    const result = checkoutSchema.safeParse(invalidDeliveryType);
    expect(result.success).toBe(false);
  });

  it("debe rechazar paymentMethod fuera del rango permitido (1 a 3)", () => {
    const invalidPaymentMethod = { ...validData, paymentMethod: 5 };
    const result = checkoutSchema.safeParse(invalidPaymentMethod);
    expect(result.success).toBe(false);
  });
});
