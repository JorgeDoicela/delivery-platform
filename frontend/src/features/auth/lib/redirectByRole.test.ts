import { describe, it, expect } from "vitest";
import {
  isOperationalPath,
  isUserInRole,
  resolvePostLoginRedirect,
} from "./redirectByRole";
import { UserRole } from "../types";
import { resolveTenantRouting } from "@/shared/lib/tenant-routing";

describe("redirectByRole", () => {
  const routing = resolveTenantRouting({
    explicitSlug: "la-granjita",
    pathname: "/la-granjita/login",
  });

  describe("isOperationalPath", () => {
    it("identifies operational paths correctly", () => {
      expect(isOperationalPath("/cocina")).toBe(true);
      expect(isOperationalPath("/la-granjita/cocina")).toBe(true);
      expect(isOperationalPath("/admin/inventario")).toBe(true);
      expect(isOperationalPath("/la-granjita/admin/personalizacion")).toBe(true);
      expect(isOperationalPath("/repartidor")).toBe(true);
      expect(isOperationalPath("/superadmin")).toBe(true);
    });

    it("identifies public customer paths correctly", () => {
      expect(isOperationalPath("/")).toBe(false);
      expect(isOperationalPath("/la-granjita")).toBe(false);
      expect(isOperationalPath("/la-granjita/catalogo")).toBe(false);
      expect(isOperationalPath("/la-granjita/checkout")).toBe(false);
      expect(isOperationalPath("/la-granjita/pedidos")).toBe(false);
      expect(isOperationalPath("/la-granjita/pedidos/123")).toBe(false);
      expect(isOperationalPath("/la-granjita/rastreo/123")).toBe(false);
    });
  });

  describe("isUserInRole", () => {
    it("matches roles by enum or string", () => {
      expect(isUserInRole({ role: UserRole.SuperAdmin }, UserRole.SuperAdmin)).toBe(true);
      expect(isUserInRole({ role: "SuperAdmin" }, UserRole.SuperAdmin)).toBe(true);
      expect(isUserInRole({ role: 1 }, "SuperAdmin")).toBe(true);
      expect(isUserInRole({ role: UserRole.Customer }, UserRole.TenantAdmin)).toBe(false);
    });

    it("matches roles from array of roles", () => {
      expect(
        isUserInRole({ role: "Customer", roles: ["BranchManager"] }, UserRole.BranchManager)
      ).toBe(true);
    });
  });

  describe("resolvePostLoginRedirect", () => {
    it("redirects Customer to account dashboard or safe non-operational redirectUrl", () => {
      const customer = { role: UserRole.Customer };
      expect(
        resolvePostLoginRedirect({ user: customer, routing })
      ).toBe(routing.getAccountHref());

      // Previene que el Customer sea enviado a /cocina y lo redirige a /cuenta
      expect(
        resolvePostLoginRedirect({
          user: customer,
          redirectUrl: "/la-granjita/cocina",
          routing,
        })
      ).toBe(routing.getAccountHref());

      // Permite redirect a catálogo o checkout
      expect(
        resolvePostLoginRedirect({
          user: customer,
          redirectUrl: "/la-granjita/checkout",
          routing,
        })
      ).toBe("/la-granjita/checkout");
    });

    it("redirects KitchenStaff and Cashier to kitchen", () => {
      const kitchenStaff = { role: UserRole.KitchenStaff };
      const cashier = { role: UserRole.Cashier };

      expect(resolvePostLoginRedirect({ user: kitchenStaff, routing })).toBe(
        routing.getKitchenHref()
      );
      expect(resolvePostLoginRedirect({ user: cashier, routing })).toBe(
        routing.getKitchenHref()
      );
    });

    it("redirects Driver to driver console", () => {
      const driver = { role: UserRole.Driver };
      expect(resolvePostLoginRedirect({ user: driver, routing })).toBe(
        routing.getDriverHref()
      );
    });

    it("redirects BranchManager to inventory dashboard", () => {
      const manager = { role: UserRole.BranchManager };
      expect(resolvePostLoginRedirect({ user: manager, routing })).toBe(
        routing.getAdminHref("inventario")
      );
    });

    it("redirects TenantAdmin to customization dashboard", () => {
      const admin = { role: UserRole.TenantAdmin };
      expect(resolvePostLoginRedirect({ user: admin, routing })).toBe(
        routing.getAdminHref("personalizacion")
      );
    });

    it("redirects SuperAdmin to superadmin console", () => {
      const superAdmin = { role: UserRole.SuperAdmin };
      expect(resolvePostLoginRedirect({ user: superAdmin, routing })).toBe(
        routing.getSuperAdminHref()
      );
    });
  });
});

