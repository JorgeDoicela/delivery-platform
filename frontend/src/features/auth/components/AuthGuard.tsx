"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "../store/useAuthStore";
import { UserRole, type UserRoleName } from "../types";
import { ShieldAlert, Loader2 } from "lucide-react";
import { useIsMounted } from "@/shared/hooks/useIsMounted";

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
        <p className="text-xs font-semibold text-text-inverse-muted uppercase tracking-wider">
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
    const userRoleStr = String(user.role);
    const hasRole = allowedRoles.some((role) => String(role) === userRoleStr);

    if (!hasRole) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-red-950/40 border border-red-800 flex items-center justify-center mb-4">
            <ShieldAlert className="w-6 h-6 text-red-400" />
          </div>
          <h2 className="text-lg font-bold text-text-inverse-strong uppercase tracking-tight">
            Acceso no autorizado
          </h2>
          <p className="text-xs text-text-inverse-muted mt-2 max-w-md">
            Tu rol operativo actual no cuenta con los privilegios necesarios para
            acceder a esta vista. Contacta a un administrador.
          </p>
        </div>
      );
    }
  }

  return <>{children}</>;
}

