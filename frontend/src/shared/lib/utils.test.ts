import { describe, it, expect } from "vitest";
import { cn, formatCurrency } from "./utils";

describe("utils", () => {
  describe("cn", () => {
    it("debe fusionar clases condicionales simples", () => {
      const result = cn("text-sm", true && "font-bold", false && "italic");
      expect(result).toBe("text-sm font-bold");
    });

    it("debe resolver conflictos de Tailwind CSS mediante twMerge", () => {
      const result = cn("p-4", "p-6", "text-red-500", "text-blue-500");
      expect(result).toBe("p-6 text-blue-500");
    });

    it("debe manejar valores nulos, indefinidos y arreglos correctamente", () => {
      const result = cn("base-class", null, undefined, ["extra-1", "extra-2"]);
      expect(result).toBe("base-class extra-1 extra-2");
    });
  });

  describe("formatCurrency", () => {
    it("debe formatear valores positivos con moneda USD y dos decimales", () => {
      const formatted = formatCurrency(25.5);
      // Remueve espacios no separables si los hubiera (NBSP) para validar monto y simbolo
      const normalized = formatted.replace(/\u00a0/g, " ");
      expect(normalized).toContain("25,50");
      expect(normalized).toContain("$");
    });

    it("debe formatear cero correctamente", () => {
      const formatted = formatCurrency(0);
      const normalized = formatted.replace(/\u00a0/g, " ");
      expect(normalized).toContain("0,00");
      expect(normalized).toContain("$");
    });
  });
});
