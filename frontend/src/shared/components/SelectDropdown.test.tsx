import React from "react";
import { describe, it, expect, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { SelectDropdown } from "./SelectDropdown";

describe("SelectDropdown Component", () => {
  const options = [
    { value: "cat-1", label: "Personales" },
    { value: "cat-2", label: "Bebidas" },
    { value: "cat-3", label: "Porciones" },
  ];

  it("debe renderizar el disparador con aria-label y atributos accesibles", () => {
    const html = renderToString(
      <SelectDropdown options={options} onChange={vi.fn()} />
    );

    expect(html).toContain('aria-haspopup="listbox"');
    expect(html).toContain('aria-label="Ver más opciones"');
    expect(html).toContain('aria-expanded="false"');
  });

  it("debe renderizar la etiqueta personalizada en el disparador si se proporciona", () => {
    const html = renderToString(
      <SelectDropdown
        options={options}
        onChange={vi.fn()}
        triggerLabel={<span>Más Categorías</span>}
      />
    );

    expect(html).toContain("Más Categorías");
  });

  it("debe resaltar visualmente cuando el valor seleccionado pertenece a las opciones", () => {
    const html = renderToString(
      <SelectDropdown
        options={options}
        value="cat-2"
        onChange={vi.fn()}
      />
    );

    // Debe mostrar la etiqueta de la opción seleccionada dentro del botón activo
    expect(html).toContain("Bebidas");
    expect(html).toContain("bg-brand-primary");
  });

  it("debe aplicar clases personalizadas y alineación de menú", () => {
    const html = renderToString(
      <SelectDropdown
        options={options}
        onChange={vi.fn()}
        className="test-custom-trigger"
        align="right"
      />
    );

    expect(html).toContain("test-custom-trigger");
  });
});
