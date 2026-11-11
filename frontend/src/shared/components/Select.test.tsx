import React from "react";
import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { Select, type SelectOption } from "./Select";

const MOCK_OPTIONS: SelectOption[] = [
  { value: "CEDULA", label: "Cédula de Identidad" },
  { value: "RUC", label: "Registro Único de Contribuyentes", badge: "SRI" },
  { value: "PASAPORTE", label: "Pasaporte" },
  { value: "INACTIVO", label: "Opción Deshabilitada", disabled: true },
];

describe("Select Component", () => {
  it("debe renderizar label, placeholder y atributos accesibles", () => {
    const html = renderToString(
      <Select
        label="Tipo de Identificación"
        placeholder="Selecciona tu documento"
        options={MOCK_OPTIONS}
        required
      />
    );

    expect(html).toContain("Tipo de Identificación");
    expect(html).toContain("Selecciona tu documento");
    expect(html).toContain('role="combobox"');
    expect(html).toContain('aria-haspopup="listbox"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain("*");
  });

  it("debe renderizar el valor seleccionado y su badge", () => {
    const html = renderToString(
      <Select
        label="Tipo de Identificación"
        options={MOCK_OPTIONS}
        value="RUC"
      />
    );

    expect(html).toContain("Registro Único de Contribuyentes");
    expect(html).toContain("SRI");
  });

  it("debe renderizar mensaje de error y marcar aria-invalid", () => {
    const html = renderToString(
      <Select
        label="Documento"
        options={MOCK_OPTIONS}
        error="El documento es requerido para facturación"
      />
    );

    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain("El documento es requerido para facturación");
    expect(html).toContain("border-red-500");
  });

  it("debe renderizar helperText cuando no existe error", () => {
    const html = renderToString(
      <Select
        label="Documento"
        options={MOCK_OPTIONS}
        helperText="Formato válido emitido por el SRI"
      />
    );

    expect(html).toContain("Formato válido emitido por el SRI");
    expect(html).not.toContain("border-red-500");
  });

  it("debe renderizar input hidden para integración de formularios si name está definido", () => {
    const html = renderToString(
      <Select
        name="identificationType"
        label="Documento"
        options={MOCK_OPTIONS}
        value="CEDULA"
      />
    );

    expect(html).toContain('type="hidden"');
    expect(html).toContain('name="identificationType"');
    expect(html).toContain('value="CEDULA"');
  });

  it("debe aplicar estilos inhabilitados si disabled es true", () => {
    const html = renderToString(
      <Select
        label="Documento"
        options={MOCK_OPTIONS}
        disabled
      />
    );

    expect(html).toContain("disabled");
    expect(html).toContain("opacity-50");
    expect(html).toContain("cursor-not-allowed");
  });

  it("debe aplicar clases de tamaño sm, md y lg", () => {
    const htmlSm = renderToString(
      <Select options={MOCK_OPTIONS} size="sm" />
    );
    const htmlLg = renderToString(
      <Select options={MOCK_OPTIONS} size="lg" />
    );

    expect(htmlSm).toContain("min-h-[36px]");
    expect(htmlLg).toContain("min-h-[50px]");
  });

  it("debe permitir pasar clases personalizadas en triggerClassName y className", () => {
    const html = renderToString(
      <Select
        options={MOCK_OPTIONS}
        className="custom-container-class"
        triggerClassName="custom-trigger-class"
      />
    );

    expect(html).toContain("custom-container-class");
    expect(html).toContain("custom-trigger-class");
  });
});
