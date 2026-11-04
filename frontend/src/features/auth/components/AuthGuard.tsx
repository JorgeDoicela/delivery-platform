"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "../store/useAuthStore";
import { UserRole, type UserRoleName } from "../types";
import { ShieldAlert, Loader2 } from "lucide-react";
import { useIsMounted } from "@/shared/hooks/useIsMounted";

const ROLE_NAME_TO_ENUM: Record<string, UserRole> = {
  SuperAdmin: UserRole.SuperAdmin,
  TenantAdmin: UserRole.TenantAdmin,
  BranchManager: UserRole.BranchManager,
  Cashier: UserRole.Cashier,
  KitchenStaff: UserRole.KitchenStaff,
  Driver: UserRole.Driver,
  Customer: UserRole.Customer,
};

const ENUM_TO_ROLE_NAME: Record<number, UserRoleName> = {
  [UserRole.SuperAdmin]: "SuperAdmin",
  [UserRole.TenantAdmin]: "TenantAdmin",
  [UserRole.BranchManager]: "BranchManager",
  [UserRole.Cashier]: "Cashier",
  [UserRole.KitchenStaff]: "KitchenStaff",
  [UserRole.Driver]: "Driver",
  [UserRole.Customer]: "Customer",
};

export function hasRequiredRole(
  userRole: UserRole | UserRoleName | undefined | null,
  userRoles: UserRoleName[] | undefined | null,
  allowedRoles?: (UserRole | UserRoleName)[]
): boolean {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  if (!userRole && (!userRoles || userRoles.length === 0)) return false;

  const userRolesNormalized = new Set<string>();

  const addRole = (r: UserRole | UserRoleName | number | string) => {
    const str = String(r);
    userRolesNormalized.add(str);
    if (typeof r === "number" || /^\d+$/.test(str)) {
      const name = ENUM_TO_ROLE_NAME[Number(str)];
      if (name) userRolesNormalized.add(name);
    } else {
      const enumVal = ROLE_NAME_TO_ENUM[str];
      if (enumVal !== undefined) userRolesNormalized.add(String(enumVal));
    }
  };

  if (userRole) addRole(userRole);
  if (Array.isArray(userRoles)) {
    for (const r of userRoles) addRole(r);
  }

  return allowedRoles.some((allowed) => {
    const str = String(allowed);
    if (userRolesNormalized.has(str)) return true;
    if (typeof allowed === "number" || /^\d+$/.test(str)) {
      const name = ENUM_TO_ROLE_NAME[Number(str)];
      return Boolean(name && userRolesNormalized.has(name));
    } else {
      const enumVal = ROLE_NAME_TO_ENUM[str];
      return Boolean(enumVal !== undefined && userRolesNormalized.has(String(enumVal)));
    }
  });
}

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: (UserRole | UserRoleName)[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isMounted = useIsMounted();

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isMounted) return;

    if (!isAuthenticated && useAuthStore.getState().status !== "loading") {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isMounted, isAuthenticated, pathname, router]);

  if (!isMounted || (useAuthStore.getState().status === "loading" && !user)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
          Verificando credenciales de acceso...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Comprobación de roles permitidos si se especifican
  if (allowedRoles && allowedRoles.length > 0 && user) {
    const hasRole = hasRequiredRole(user.role, user.roles, allowedRoles);

    if (!hasRole) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mb-4">
            <ShieldAlert className="w-6 h-6 text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-text-strong uppercase tracking-tight">
            Acceso no autorizado
          </h2>
          <p className="text-xs text-text-muted mt-2 max-w-md">
            Tu rol operativo actual no cuenta con los privilegios necesarios para
            acceder a esta vista. Contacta a un administrador.
          </p>
        </div>
      );
    }
  }

  return <>{children}</>;
}

