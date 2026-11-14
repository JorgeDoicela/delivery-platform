import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

describe("Dynamic Multi-Tenant PWA Manifest Handler", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("genera el manifest de plataforma para la raiz sin tenant", async () => {
    const request = new NextRequest("http://localhost:3005/manifest.json");
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/manifest+json");

    const manifest = await response.json();
    expect(manifest.id).toBe("/");
    expect(manifest.start_url).toBe("/");
    expect(manifest.scope).toBe("/");
    expect(manifest.name).toBe("Mesafy | Plataforma Gastronómica");
    expect(manifest.short_name).toBe("Mesafy");
    expect(manifest.display).toBe("standalone");
  });

  it("genera el manifest aislado para un tenant especifico (la-granjita)", async () => {
    const request = new NextRequest("http://localhost:3005/manifest.json?slug=la-granjita");
    const response = await GET(request);

    expect(response.status).toBe(200);
    const manifest = await response.json();

    expect(manifest.id).toBe("/la-granjita");
    expect(manifest.start_url).toBe("/la-granjita");
    expect(manifest.scope).toBe("/la-granjita/");
    expect(manifest.name).toBe("La Granjita - Asadero");
    expect(manifest.short_name).toBe("La Granjita");
    expect(manifest.theme_color).toBe("#E4002B");
    expect(manifest.icons).toHaveLength(2);
    expect(manifest.icons[0].src).toBe("/images/tenants/la-granjita/identidad/logo.png");
    expect(manifest.shortcuts[0].url).toBe("/la-granjita/menu");
    expect(manifest.shortcuts[1].url).toBe("/la-granjita/pedidos");
  });

  it("genera el manifest aislado para una sucursal especifica de un tenant", async () => {
    const request = new NextRequest("http://localhost:3005/manifest.json?slug=la-granjita&branch=1");
    const response = await GET(request);

    expect(response.status).toBe(200);
    const manifest = await response.json();

    expect(manifest.id).toBe("/la-granjita?branch=1");
    expect(manifest.start_url).toBe("/la-granjita?branch=1");
    expect(manifest.scope).toBe("/la-granjita/");
    expect(manifest.name).toBe("La Granjita • Sucursal Guamaní");
    expect(manifest.short_name).toBe("La Granjita (Guamaní)");
  });

  it("resuelve el tenant automaticamente desde la cabecera Referer cuando no hay query param", async () => {
    const request = new NextRequest("http://localhost:3005/manifest.json", {
      headers: {
        referer: "http://localhost:3005/brasas-del-valle/menu",
      },
    });
    const response = await GET(request);

    expect(response.status).toBe(200);
    const manifest = await response.json();

    expect(manifest.id).toBe("/brasas-del-valle");
    expect(manifest.start_url).toBe("/brasas-del-valle");
    expect(manifest.scope).toBe("/brasas-del-valle/");
    expect(manifest.name).toBe("Brasas del Valle - Parrilla & Cortes Madurados");
    expect(manifest.short_name).toBe("Brasas del Valle");
    expect(manifest.theme_color).toBe("#047857");
  });

  it("soporta subdominios multi-tenant ajustando scope y start_url a la raiz", async () => {
    const request = new NextRequest("http://la-granjita.mesafy.com/manifest.json", {
      headers: {
        host: "la-granjita.mesafy.com",
      },
    });
    const response = await GET(request);

    expect(response.status).toBe(200);
    const manifest = await response.json();

    expect(manifest.id).toBe("/");
    expect(manifest.start_url).toBe("/");
    expect(manifest.scope).toBe("/");
    expect(manifest.short_name).toBe("La Granjita");
    expect(manifest.shortcuts[0].url).toBe("/menu");
    expect(manifest.shortcuts[1].url).toBe("/pedidos");
  });
});
