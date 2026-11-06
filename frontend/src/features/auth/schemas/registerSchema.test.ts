import { describe, it, expect } from "vitest";
import { registerSchema } from "./registerSchema";

describe("registerSchema", () => {
  it("validates valid registration data", () => {
    const validData = {
      fullName: "Carlos Repartidor",
      email: "carlos@example.com",
      phone: "0991234567",
      password: "Password123",
      confirmPassword: "Password123",
    };

    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("fails when passwords do not match", () => {
    const invalidData = {
      fullName: "Carlos Repartidor",
      email: "carlos@example.com",
      phone: "0991234567",
      password: "Password123",
      confirmPassword: "DifferentPassword",
    };

    const result = registerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Las contraseñas no coinciden.");
    }
  });

  it("fails on invalid email", () => {
    const invalidData = {
      fullName: "Carlos Repartidor",
      email: "not-an-email",
      phone: "0991234567",
      password: "Password123",
      confirmPassword: "Password123",
    };

    const result = registerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("fails on short password", () => {
    const invalidData = {
      fullName: "Carlos Repartidor",
      email: "carlos@example.com",
      phone: "0991234567",
      password: "123",
      confirmPassword: "123",
    };

    const result = registerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});
