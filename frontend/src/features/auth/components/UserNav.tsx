"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, User as UserIcon } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useIsMounted } from "@/shared/hooks/useIsMounted";
import { useTenantRoutes } from "@/shared/lib/tenant-routing";
import { getApiBaseUrl } from "@/shared/lib/api-client";

export function UserNav() {
  const router = useRouter();
  const isMounted = useIsMounted();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const routes = useTenantRoutes(user?.tenantSlug);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (!isMounted || !user) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.push(routes.getLoginHref());
    router.refresh();
  };

  const avatarSrc = user.avatarUrl
    ? user.avatarUrl.startsWith("http")
      ? user.avatarUrl
      : `${getApiBaseUrl()}${user.avatarUrl.startsWith("/") ? user.avatarUrl : `/${user.avatarUrl}`}`
    : null;

  return (
    <div className="flex items-center gap-2 pl-3 border-l border-surface-border">
      <Link
        href={routes.getAccountHref()}
        title="Ver mi cuenta y pedidos"
        className="flex items-center gap-2 text-xs text-text-base hover:text-text-strong transition-colors cursor-pointer"
      >
        <div className="w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-[10px] overflow-hidden shrink-0 border border-neutral-200">
          {avatarSrc ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={avatarSrc} alt={user.fullName} className="w-full h-full object-cover" />
          ) : (
            <UserIcon className="w-3.5 h-3.5 text-brand-primary shrink-0" />
          )}
        </div>
        <span className="font-semibold text-text-strong max-w-[120px] truncate hidden xl:inline">
          {user.fullName}
        </span>
      </Link>

      <button
        type="button"
        onClick={handleLogout}
        title="Cerrar sesión"
        aria-label="Cerrar sesión"
        className="p-1.5 rounded-full text-text-muted hover:text-red-500 hover:bg-surface-card-hover transition-colors cursor-pointer"
      >
        <LogOut className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
