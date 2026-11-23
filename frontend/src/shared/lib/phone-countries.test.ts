import { describe, it, expect } from "vitest";
import {
  SUPPORTED_COUNTRIES,
  DEFAULT_COUNTRY,
  parsePhoneNumber,
  formatToE164,
} from "./phone-countries";

describe("phone-countries", () => {
  it("debe contener a Ecuador como país por defecto con prefijo +593", () => {
    expect(DEFAULT_COUNTRY.code).toBe("EC");
    expect(DEFAULT_COUNTRY.dialCode).toBe("+593");
    expect(SUPPORTED_COUNTRIES.length).toBeGreaterThanOrEqual(15);
  });

  describe("parsePhoneNumber", () => {
    it("debe retornar Ecuador por defecto para cadenas vacías o nulas", () => {
      expect(parsePhoneNumber("").country.code).toBe("EC");
      expect(parsePhoneNumber(null).country.code).toBe("EC");
      expect(parsePhoneNumber(undefined).country.code).toBe("EC");
    });

    it("debe detectar correctamente el prefijo +593 de Ecuador", () => {
      const res = parsePhoneNumber("+593987654321");
      expect(res.country.code).toBe("EC");
      expect(res.localNumber).toBe("987654321");
    });

    it("debe detectar prefijo +57 de Colombia", () => {
      const res = parsePhoneNumber("+573001234567");
      expect(res.country.code).toBe("CO");
      expect(res.localNumber).toBe("3001234567");
    });

    it("debe detectar prefijo +1 de Estados Unidos", () => {
      const res = parsePhoneNumber("+12025550123");
      expect(res.country.code).toBe("US");
      expect(res.localNumber).toBe("2025550123");
    });

    it("debe parsear números que empiezan directamente con 593 sin signo +", () => {
      const res = parsePhoneNumber("593987654321");
      expect(res.country.code).toBe("EC");
      expect(res.localNumber).toBe("987654321");
    });

    it("debe remover el 0 inicial si el número local viene con 0", () => {
      const res = parsePhoneNumber("0987654321");
      expect(res.country.code).toBe("EC");
      expect(res.localNumber).toBe("987654321");
    });

    it("debe truncar el número local si excede el maxLength del país", () => {
      const res = parsePhoneNumber("+5939876543219999");
      expect(res.country.code).toBe("EC");
      expect(res.localNumber).toBe("987654321");
      expect(res.localNumber.length).toBe(9);
    });
  });

  describe("formatToE164", () => {
    it("debe formatear a estándar internacional E.164 removiendo el 0 inicial en Ecuador", () => {
      const ecuador = SUPPORTED_COUNTRIES.find((c) => c.code === "EC")!;
      expect(formatToE164(ecuador, "0987654321")).toBe("+593987654321");
      expect(formatToE164(ecuador, "987654321")).toBe("+593987654321");
    });

    it("debe truncar números locales que excedan el límite del país en formatToE164", () => {
      const ecuador = SUPPORTED_COUNTRIES.find((c) => c.code === "EC")!;
      expect(formatToE164(ecuador, "987654321000")).toBe("+593987654321");
    });

    it("debe formatear a estándar internacional E.164 para otros países", () => {
      const colombia = SUPPORTED_COUNTRIES.find((c) => c.code === "CO")!;
      expect(formatToE164(colombia, "300 123 4567")).toBe("+573001234567");

      const usa = SUPPORTED_COUNTRIES.find((c) => c.code === "US")!;
      expect(formatToE164(usa, "2025550123")).toBe("+12025550123");
    });

    it("debe retornar cadena vacía si no hay dígitos", () => {
      const ecuador = DEFAULT_COUNTRY;
      expect(formatToE164(ecuador, "")).toBe("");
      expect(formatToE164(ecuador, "   ")).toBe("");
    });
  });
});
