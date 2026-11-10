import { describe, it, expect } from "vitest";
import {
  updateProfileSchema,
  addressSchema,
  changePasswordSchema,
} from "./accountSchemas";

describe("accountSchemas", () => {
  describe("updateProfileSchema", () => {
    it("debe validar un perfil correcto", () => {
      const result = updateProfileSchema.safeParse({
        fullName: "Carlos Mendoza",
        phone: "+593987654321",
        identificationType: "CEDULA",
        identificationNumber: "1712345678",
      });
      expect(result.success).toBe(true);
    });

    it("debe rechazar nombres demasiado cortos", () => {
      const result = updateProfileSchema.safeParse({
        fullName: "Ca",
        phone: "+593987654321",
      });
      expect(result.success).toBe(false);
    });

    it("debe rechazar teléfonos inválidos", () => {
      const result = updateProfileSchema.safeParse({
        fullName: "Carlos Mendoza",
        phone: "123",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("addressSchema", () => {
    it("debe validar una dirección completa", () => {
      const result = addressSchema.safeParse({
        label: "Casa",
        street: "Av. Amazonas",
        secondaryStreet: "y Naciones Unidas",
        buildingNumber: "N34-120",
        reference: "Frente al parque La Carolina",
        latitude: -0.1807,
        longitude: -78.4678,
        isDefault: true,
      });
      expect(result.success).toBe(true);
    });

    it("debe rechazar si falta la calle o latitud", () => {
      const result = addressSchema.safeParse({
        label: "Casa",
        street: "",
        latitude: -0.1807,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("changePasswordSchema", () => {
    it("debe validar contraseñas coincidentes y seguras", () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: "OldPassword123",
        newPassword: "NewSecurePassword1",
        confirmPassword: "NewSecurePassword1",
      });
      expect(result.success).toBe(true);
    });

    it("debe rechazar si las contraseñas no coinciden", () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: "OldPassword123",
        newPassword: "NewSecurePassword1",
        confirmPassword: "DifferentPassword2",
      });
      expect(result.success).toBe(false);
    });

    it("debe rechazar si la nueva contraseña no tiene números o mayúsculas", () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: "OldPassword123",
        newPassword: "passwordlowercase",
        confirmPassword: "passwordlowercase",
      });
      expect(result.success).toBe(false);
    });
  });
});
