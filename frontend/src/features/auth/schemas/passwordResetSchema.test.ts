import { describe, it, expect } from "vitest";
import { forgotPasswordSchema } from "./forgotPasswordSchema";
import { resetPasswordSchema } from "./resetPasswordSchema";

describe("forgotPasswordSchema", () => {
  it("validates correct email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "cliente@mesafy.doicela.dev" });
    expect(result.success).toBe(true);
  });

  it("fails on invalid email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "no-valido" });
    expect(result.success).toBe(false);
  });

  it("fails on empty email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "" });
    expect(result.success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("validates valid reset payload", () => {
    const result = resetPasswordSchema.safeParse({
      email: "cliente@mesafy.doicela.dev",
      token: "secret_reset_token_12345",
      password: "NewPassword123!",
      confirmPassword: "NewPassword123!",
    });
    expect(result.success).toBe(true);
  });

  it("fails when passwords do not match", () => {
    const result = resetPasswordSchema.safeParse({
      email: "cliente@mesafy.doicela.dev",
      token: "secret_reset_token_12345",
      password: "NewPassword123!",
      confirmPassword: "DifferentPassword456!",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Las contraseñas no coinciden.");
    }
  });

  it("fails on short password", () => {
    const result = resetPasswordSchema.safeParse({
      email: "cliente@mesafy.doicela.dev",
      token: "secret_reset_token_12345",
      password: "123",
      confirmPassword: "123",
    });
    expect(result.success).toBe(false);
  });

  it("fails on short or missing token", () => {
    const result = resetPasswordSchema.safeParse({
      email: "cliente@mesafy.doicela.dev",
      token: "123",
      password: "NewPassword123!",
      confirmPassword: "NewPassword123!",
    });
    expect(result.success).toBe(false);
  });
});

