import { describe, it, expect } from "vitest";
import { resolveTenantRouting } from "./tenant-routing";

describe("resolveTenantRouting", () => {
  describe("Plataforma con ruta /[slug] (localhost:3005/la-granjita)", () => {
    it("resuelve rutas con prefijo /[slug] en host de plataforma", () => {
      const routes = resolveTenantRouting({
        pathname: "/la-granjita",
        hostname: "localhost",
      });

      expect(routes.isPlatformHost).toBe(true);
      expect(routes.isCustomDomain).toBe(false);
      expect(routes.subdomain).toBeNull();
      expect(routes.activeTenantSlug).toBe("la-granjita");
      expect(routes.basePath).toBe("/la-granjita");

      expect(routes.getHomeHref()).toBe("/la-granjita");
      expect(routes.getCatalogHref()).toBe("/la-granjita/menu");
      expect(routes.getLoginHref()).toBe("/la-granjita/login");
      expect(routes.getRegisterHref()).toBe("/la-granjita/login?tab=register");
      expect(routes.getCheckoutHref()).toBe("/la-granjita/checkout");
      expect(routes.getRastreoHref()).toBe("/la-granjita/rastreo");
      expect(routes.getRastreoHref("orden-123")).toBe("/la-granjita/rastreo/orden-123");
      expect(routes.getSucursalesHref()).toBe("/la-granjita/sucursales");
      expect(routes.getSucursalesHref(2)).toBe("/la-granjita/sucursal/2");
      expect(routes.getKitchenHref()).toBe("/la-granjita/cocina");
      expect(routes.getDriverHref()).toBe("/la-granjita/repartidor");
      expect(routes.getAdminHref("personalizacion")).toBe("/la-granjita/admin/personalizacion");
      expect(routes.getAdminHref("inventario")).toBe("/la-granjita/admin/inventario");
      expect(routes.getAdminHref("sucursales")).toBe("/la-granjita/admin/sucursales");
      expect(routes.getTermsHref()).toBe("/la-granjita/terminos");
      expect(routes.getPrivacyHref()).toBe("/la-granjita/privacidad");
    });

    it("preserva el slug cuando se encuentra dentro de la ruta de login /la-granjita/login", () => {
      const routes = resolveTenantRouting({
        pathname: "/la-granjita/login",
        hostname: "localhost",
      });

      expect(routes.activeTenantSlug).toBe("la-granjita");
      expect(routes.basePath).toBe("/la-granjita");
      expect(routes.getHomeHref()).toBe("/la-granjita");
      expect(routes.getLoginHref()).toBe("/la-granjita/login");
      expect(routes.getLoginHref({ tab: "register" })).toBe("/la-granjita/login?tab=register");
      expect(routes.getLoginHref({ redirect: "/la-granjita/cocina" })).toBe(
        "/la-granjita/login?redirect=%2Fla-granjita%2Fcocina"
      );
    });

    it("soporta enlaces con sucursal seleccionada", () => {
      const routes = resolveTenantRouting({
        pathname: "/la-granjita",
        hostname: "localhost",
      });

      expect(routes.getHomeHref(1)).toBe("/la-granjita?branch=1");
      expect(routes.getCatalogHref(2)).toBe("/la-granjita/menu?branch=2");
      expect(routes.getSucursalesHref(3)).toBe("/la-granjita/sucursal/3");
    });

    it("funciona con puertos no estandar en host (ej. localhost:3005)", () => {
      const routes = resolveTenantRouting({
        pathname: "/brasas-del-valle",
        hostname: "localhost:3005",
      });

      expect(routes.isPlatformHost).toBe(true);
      expect(routes.activeTenantSlug).toBe("brasas-del-valle");
      expect(routes.basePath).toBe("/brasas-del-valle");
      expect(routes.getLoginHref()).toBe("/brasas-del-valle/login");
    });
  });

  describe("Dominio Propio / Custom Domain (pedidos.lagranjita.com y pollos.ec)", () => {
    it("resuelve rutas limpias en la raíz sin prefijo de slug", () => {
      const routes = resolveTenantRouting({
        pathname: "/",
        hostname: "pedidos.lagranjita.com",
        explicitSlug: "la-granjita",
      });

      expect(routes.isCustomDomain).toBe(true);
      expect(routes.isPlatformHost).toBe(false);
      expect(routes.subdomain).toBeNull();
      expect(routes.basePath).toBe("");

      expect(routes.getHomeHref()).toBe("/");
      expect(routes.getCatalogHref()).toBe("/menu");
      expect(routes.getLoginHref()).toBe("/login");
      expect(routes.getRegisterHref()).toBe("/login?tab=register");
      expect(routes.getCheckoutHref()).toBe("/checkout");
      expect(routes.getRastreoHref()).toBe("/rastreo");
      expect(routes.getRastreoHref("abc")).toBe("/rastreo/abc");
      expect(routes.getSucursalesHref()).toBe("/sucursales");
      expect(routes.getSucursalesHref(1)).toBe("/sucursal/1");
      expect(routes.getKitchenHref()).toBe("/cocina");
      expect(routes.getDriverHref()).toBe("/repartidor");
      expect(routes.getAdminHref("personalizacion")).toBe("/admin/personalizacion");
    });

    it("soporta dominios de segundo nivel directos como pollos.ec", () => {
      const routes = resolveTenantRouting({
        pathname: "/login",
        hostname: "pollos.ec",
        explicitSlug: "pollos-express",
      });

      expect(routes.isCustomDomain).toBe(true);
      expect(routes.activeTenantSlug).toBe("pollos-express");
      expect(routes.basePath).toBe("");
      expect(routes.getLoginHref()).toBe("/login");
      expect(routes.getCheckoutHref()).toBe("/checkout");
    });
  });

  describe("Subdominio de Plataforma (la-granjita.mesafy.com)", () => {
    it("extrae el tenant del subdominio y mantiene rutas limpias", () => {
      const routes = resolveTenantRouting({
        pathname: "/",
        hostname: "la-granjita.mesafy.com",
      });

      expect(routes.subdomain).toBe("la-granjita");
      expect(routes.activeTenantSlug).toBe("la-granjita");
      expect(routes.basePath).toBe("");

      expect(routes.getHomeHref()).toBe("/");
      expect(routes.getLoginHref()).toBe("/login");
      expect(routes.getCheckoutHref()).toBe("/checkout");
      expect(routes.getKitchenHref()).toBe("/cocina");
      expect(routes.getSucursalesHref(5)).toBe("/sucursal/5");
    });

    it("resuelve subdominios en entorno dev (la-granjita.mesafy.dev)", () => {
      const routes = resolveTenantRouting({
        pathname: "/cocina",
        hostname: "la-granjita.mesafy.dev",
      });

      expect(routes.subdomain).toBe("la-granjita");
      expect(routes.activeTenantSlug).toBe("la-granjita");
      expect(routes.basePath).toBe("");
      expect(routes.getLoginHref()).toBe("/login");
    });
  });

  describe("Raíz Global de la Plataforma (localhost:3005/ y mesafy.com/)", () => {
    it("resuelve portal multimarca y login global de plataforma", () => {
      const routes = resolveTenantRouting({
        pathname: "/",
        hostname: "localhost",
      });

      expect(routes.isPlatformRoot).toBe(true);
      expect(routes.basePath).toBe("");
      expect(routes.getHomeHref()).toBe("/");
      expect(routes.getCatalogHref()).toBe("/#restaurantes");
      expect(routes.getLoginHref()).toBe("/login");
      expect(routes.getSuperAdminHref()).toBe("/superadmin");
    });

    it("resuelve login general en /login", () => {
      const routes = resolveTenantRouting({
        pathname: "/login",
        hostname: "localhost",
      });

      expect(routes.isPlatformRoot).toBe(true);
      expect(routes.basePath).toBe("");
      expect(routes.getLoginHref()).toBe("/login");
      expect(routes.getLoginHref({ redirect: "/superadmin" })).toBe(
        "/login?redirect=%2Fsuperadmin"
      );
    });

    it("reconoce mesafy.com como host de plataforma", () => {
      const routes = resolveTenantRouting({
        pathname: "/",
        hostname: "mesafy.com",
      });

      expect(routes.isPlatformHost).toBe(true);
      expect(routes.isPlatformRoot).toBe(true);
      expect(routes.basePath).toBe("");
      expect(routes.getHomeHref()).toBe("/");
    });
  });
});
