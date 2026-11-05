import { describe, it, expect } from "vitest";
import { getBranchOperatingStatus, parseTimeToMinutes } from "./schedule";

describe("parseTimeToMinutes", () => {
  it("debe convertir HH:mm a minutos correctamente", () => {
    expect(parseTimeToMinutes("00:00")).toBe(0);
    expect(parseTimeToMinutes("10:30")).toBe(630);
    expect(parseTimeToMinutes("21:30")).toBe(1290);
    expect(parseTimeToMinutes("23:59")).toBe(1439);
  });

  it("debe retornar 0 para cadenas inválidas", () => {
    expect(parseTimeToMinutes("")).toBe(0);
    expect(parseTimeToMinutes("invalido")).toBe(0);
  });
});

describe("getBranchOperatingStatus", () => {
  it("debe marcar como ABIERTO dentro del horario habitual", () => {
    const fakeNow = new Date("2026-11-05T14:00:00");
    const status = getBranchOperatingStatus("10:30", "21:30", fakeNow);

    expect(status.isOpen).toBe(true);
    expect(status.statusLabel).toBe("Abierto Ahora");
    expect(status.badgeTone).toBe("success");
    expect(status.detailLabel).toContain("21:30");
  });

  it("debe marcar como CERRADO antes de la hora de apertura", () => {
    const fakeNow = new Date("2026-11-05T08:30:00");
    const status = getBranchOperatingStatus("10:30", "21:30", fakeNow);

    expect(status.isOpen).toBe(false);
    expect(status.statusLabel).toBe("Cerrado Actualmente");
    expect(status.badgeTone).toBe("neutral");
    expect(status.detailLabel).toContain("10:30");
  });

  it("debe marcar como CERRADO después de la hora de cierre", () => {
    const fakeNow = new Date("2026-11-05T22:00:00");
    const status = getBranchOperatingStatus("10:30", "21:30", fakeNow);

    expect(status.isOpen).toBe(false);
    expect(status.statusLabel).toBe("Cerrado Actualmente");
    expect(status.detailLabel).toContain("10:30");
  });

  it("debe alertar CIERRA PRONTO si faltan 30 min o menos", () => {
    const fakeNow = new Date("2026-11-05T21:10:00"); // faltan 20 minutos para las 21:30
    const status = getBranchOperatingStatus("10:30", "21:30", fakeNow);

    expect(status.isOpen).toBe(true);
    expect(status.isClosingSoon).toBe(true);
    expect(status.statusLabel).toBe("Cierra Pronto");
    expect(status.badgeTone).toBe("warning");
    expect(status.minutesRemaining).toBe(20);
  });

  it("debe manejar horarios nocturnos que cruzan la medianoche", () => {
    // Abre a las 18:00 y cierra a las 02:00
    const atNight = new Date("2026-11-05T23:30:00");
    expect(getBranchOperatingStatus("18:00", "02:00", atNight).isOpen).toBe(true);

    const pastMidnight = new Date("2026-11-05T01:15:00");
    expect(getBranchOperatingStatus("18:00", "02:00", pastMidnight).isOpen).toBe(true);

    const daytime = new Date("2026-11-05T12:00:00");
    expect(getBranchOperatingStatus("18:00", "02:00", daytime).isOpen).toBe(false);
  });

  it("debe usar valores fallback seguros si se reciben cadenas vacías", () => {
    const fakeNow = new Date("2026-11-05T14:00:00");
    const status = getBranchOperatingStatus("", "", fakeNow);

    expect(status.isOpen).toBe(true);
    expect(status.openingTime).toBe("10:30");
    expect(status.closingTime).toBe("21:30");
  });
});

