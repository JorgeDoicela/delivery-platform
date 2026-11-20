import React from "react";
import { describe, it, expect, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { AlertBanner } from "./AlertBanner";

describe("AlertBanner Component", () => {
  it("renderiza correctamente una variante de éxito con título y contenido", () => {
    const html = renderToString(
      <AlertBanner variant="success" title="Operación Exitosa">
        El dispositivo ha sido configurado correctamente.
      </AlertBanner>
    );

    expect(html).toContain("Operación Exitosa");
    expect(html).toContain("El dispositivo ha sido configurado correctamente.");
    expect(html).toContain("bg-emerald-50");
  });

  it("renderiza correctamente una variante de error con estilos y rol de alerta", () => {
    const html = renderToString(
      <AlertBanner variant="error">
        Este dispositivo ya se encuentra registrado.
      </AlertBanner>
    );

    expect(html).toContain("Este dispositivo ya se encuentra registrado.");
    expect(html).toContain('role="alert"');
    expect(html).toContain("bg-red-50");
  });

  it("renderiza el botón de cerrar cuando se pasa la prop onClose", () => {
    const handleClose = vi.fn();
    const html = renderToString(
      <AlertBanner variant="info" onClose={handleClose}>
        Mensaje informativo
      </AlertBanner>
    );

    expect(html).toContain("Mensaje informativo");
    expect(html).toContain('aria-label="Cerrar notificación"');
  });
});
