"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User as UserIcon } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useIsMounted } from "@/shared/hooks/useIsMounted";

export function UserNav() {
  const router = useRouter();
  const isMounted = useIsMounted();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (!isMounted || !user) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2 pl-3 border-l border-surface-border">
      <div className="flex items-center gap-1.5 text-xs text-text-base">
        <UserIcon className="w-3.5 h-3.5 text-brand-primary shrink-0" />
        <span className="font-semibold text-text-strong max-w-[120px] truncate hidden xl:inline">
          {user.fullName}
        </span>
        <span className="text-[11px] font-mono text-brand-primary font-bold uppercase">
          {String(user.role)}
        </span>
      </div>

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
