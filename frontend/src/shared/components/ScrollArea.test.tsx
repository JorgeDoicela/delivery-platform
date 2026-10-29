import React from "react";
import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { ScrollArea } from "./ScrollArea";

describe("ScrollArea Component", () => {
  it("debe renderizar el contenido hijo correctamente", () => {
    const html = renderToString(
      <ScrollArea>
        <p>Contenido de prueba desplazable</p>
      </ScrollArea>
    );

    expect(html).toContain("Contenido de prueba desplazable");
    expect(html).toContain("data-scroll-area");
  });

  it("debe aplicar la clase de variante por defecto custom-scrollbar", () => {
    const html = renderToString(
      <ScrollArea>
        <div>Item</div>
      </ScrollArea>
    );

    expect(html).toContain("custom-scrollbar");
    expect(html).toContain("overflow-y-auto");
  });

  it("debe aplicar la clase de variante brand cuando se especifica", () => {
    const html = renderToString(
      <ScrollArea variant="brand">
        <div>Item</div>
      </ScrollArea>
    );

    expect(html).toContain("scrollbar-brand");
  });

  it("debe aplicar la clase de variante dark para terminales KDS", () => {
    const html = renderToString(
      <ScrollArea variant="dark">
        <div>Item</div>
      </ScrollArea>
    );

    expect(html).toContain("scrollbar-dark");
  });

  it("debe soportar orientación horizontal", () => {
    const html = renderToString(
      <ScrollArea orientation="horizontal">
        <div>Contenido horizontal</div>
      </ScrollArea>
    );

    expect(html).toContain("overflow-x-auto");
    expect(html).toContain('data-orientation="horizontal"');
  });

  it("debe respetar maxHeight y estilos en línea", () => {
    const html = renderToString(
      <ScrollArea maxHeight="320px">
        <div>Lista larga</div>
      </ScrollArea>
    );

    expect(html).toContain("max-height:320px");
  });
});
