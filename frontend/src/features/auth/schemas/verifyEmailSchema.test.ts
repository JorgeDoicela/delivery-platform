import { describe, it, expect } from "vitest";
import { verifyEmailSchema, resendVerificationSchema } from "./verifyEmailSchema";

describe("verifyEmailSchema", () => {
  it("valida exitosamente un token SHA-256 de 64 caracteres sin email", () => {
    const validToken = "a".repeat(64);
    const result = verifyEmailSchema.safeParse({ token: validToken });
    expect(result.success).toBe(true);
  });

  it("valida exitosamente un token de 64 caracteres con email válido", () => {
    const validToken = "0123456789abcdef".repeat(4);
    const result = verifyEmailSchema.safeParse({
      token: validToken,
      email: "cliente@dominio.com",
    });
    expect(result.success).toBe(true);
  });

  it("rechaza token con longitud diferente a 64 caracteres", () => {
    const result = verifyEmailSchema.safeParse({ token: "corto123" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("64 caracteres");
    }
  });

  it("rechaza token con caracteres no hexadecimales", () => {
    const invalidHex = "z".repeat(64);
    const result = verifyEmailSchema.safeParse({ token: invalidHex });
    expect(result.success).toBe(false);
  });

  it("rechaza email mal formateado cuando se provee", () => {
    const validToken = "f".repeat(64);
    const result = verifyEmailSchema.safeParse({
      token: validToken,
      email: "invalido-sin-arroba",
    });
    expect(result.success).toBe(false);
  });
});

describe("resendVerificationSchema", () => {
  it("acepta un email válido", () => {
    const result = resendVerificationSchema.safeParse({
      email: "usuario@restaurante.com",
    });
    expect(result.success).toBe(true);
  });

  it("rechaza campo de email vacío", () => {
    const result = resendVerificationSchema.safeParse({ email: "" });
    expect(result.success).toBe(false);
  });
});

