import { UserRole, type UserRoleName } from "../types";
import type { TenantRoutingResolution } from "@/shared/lib/tenant-routing";

export interface AuthenticatedUserLike {
  id?: string;
  fullName?: string;
  email?: string;
  role?: UserRole | UserRoleName | number | string;
  roles?: (UserRole | UserRoleName | string)[];
  tenantSlug?: string | null;
  branchId?: number | string | null;
}

export function isOperationalPath(pathname: string): boolean {
  if (!pathname) return false;
  const cleanPath = pathname.split("?")[0].toLowerCase();
  const segments = cleanPath.split("/").filter(Boolean);

  const operationalKeywords = new Set([
    "admin",
    "cocina",
    "kitchen",
    "repartidor",
    "superadmin",
    "active-delivery",
  ]);

  return segments.some((segment) => operationalKeywords.has(segment));
}

export function isUserInRole(
  user: AuthenticatedUserLike | null | undefined,
  targetRole: UserRole | UserRoleName
): boolean {
  if (!user) return false;

  const roleValue = user.role;
  const targetEnum =
    typeof targetRole === "number"
      ? targetRole
      : (UserRole as unknown as Record<string, number>)[targetRole];
  const targetName =
    typeof targetRole === "string" ? targetRole : UserRole[targetRole];

  if (roleValue === targetEnum || roleValue === targetName) {
    return true;
  }

  if (typeof roleValue === "number" && targetEnum !== undefined && roleValue === targetEnum) {
    return true;
  }

  if (typeof roleValue === "string") {
    if (targetName && roleValue.toLowerCase() === targetName.toLowerCase()) {
      return true;
    }
    const parsedNum = Number(roleValue);
    if (!isNaN(parsedNum) && parsedNum === targetEnum) {
      return true;
    }
  }

  if (Array.isArray(user.roles)) {
    return user.roles.some((r) => {
      if (typeof r === "string" && targetName && r.toLowerCase() === targetName.toLowerCase()) {
        return true;
      }
      if (typeof r === "number" && targetEnum !== undefined && r === targetEnum) {
        return true;
      }
      return false;
    });
  }

  return false;
}

export function resolvePostLoginRedirect(params: {
  user: AuthenticatedUserLike | null | undefined;
  redirectUrl?: string | null;
  routing: TenantRoutingResolution;
}): string {
  const { user, redirectUrl, routing } = params;

  const isSuperAdmin = isUserInRole(user, UserRole.SuperAdmin);
  const isTenantAdmin = isUserInRole(user, UserRole.TenantAdmin);
  const isBranchManager = isUserInRole(user, UserRole.BranchManager);
  const isCashier = isUserInRole(user, UserRole.Cashier);
  const isKitchenStaff = isUserInRole(user, UserRole.KitchenStaff);
  const isDriver = isUserInRole(user, UserRole.Driver);

  // 1. SuperAdmin
  if (isSuperAdmin) {
    if (redirectUrl && !redirectUrl.includes("/login")) {
      return redirectUrl;
    }
    return routing.getSuperAdminHref();
  }

  // 2. TenantAdmin
  if (isTenantAdmin) {
    if (
      redirectUrl &&
      !redirectUrl.includes("/login") &&
      !redirectUrl.includes("/superadmin")
    ) {
      return redirectUrl;
    }
    return routing.getAdminHref("personalizacion");
  }

  // 3. BranchManager
  if (isBranchManager) {
    if (
      redirectUrl &&
      !redirectUrl.includes("/login") &&
      !redirectUrl.includes("/superadmin") &&
      !redirectUrl.includes("/personalizacion")
    ) {
      return redirectUrl;
    }
    return routing.getAdminHref("inventario");
  }

  // 4. KitchenStaff / Cashier
  if (isKitchenStaff || isCashier) {
    if (
      redirectUrl &&
      (redirectUrl.includes("/cocina") || redirectUrl.includes("/kitchen"))
    ) {
      return redirectUrl;
    }
    return routing.getKitchenHref();
  }

  // 5. Driver
  if (isDriver) {
    if (
      redirectUrl &&
      (redirectUrl.includes("/repartidor") || redirectUrl.includes("/active-delivery"))
    ) {
      return redirectUrl;
    }
    return routing.getDriverHref();
  }

  // 6. Customer o usuario estándar: NUNCA redirigir a rutas operativas
  if (redirectUrl && !isOperationalPath(redirectUrl) && !redirectUrl.includes("/login")) {
    return redirectUrl;
  }

  return routing.getAccountHref();
}

