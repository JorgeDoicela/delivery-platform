import { describe, it, expect } from "vitest";
import { loginSchema } from "./loginSchema";

describe("loginSchema", () => {
  it("debe validar credenciales correctas", () => {
    const validData = {
      email: "admin@asaderolagranjita.com",
      password: "PasswordSeguro123!",
    };

    const result = loginSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("debe fallar si el email es inválido", () => {
    const invalidData = {
      email: "correo-invalido",
      password: "Password123!",
    };

    const result = loginSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("Formato de correo electrónico inválido");
    }
  });

  it("debe fallar si la contraseña tiene menos de 6 caracteres", () => {
    const invalidData = {
      email: "cocina@asaderolagranjita.com",
      password: "123",
    };

    const result = loginSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("al menos 6 caracteres");
    }
  });

  it("debe fallar si los campos están vacíos", () => {
    const emptyData = {
      email: "",
      password: "",
    };

    const result = loginSchema.safeParse(emptyData);
    expect(result.success).toBe(false);
  });
});

