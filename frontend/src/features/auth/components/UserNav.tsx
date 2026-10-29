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
    <div className="flex items-center gap-2 pl-2 border-l border-surface-dark-border">
      <div className="flex items-center gap-1.5 text-xs text-text-inverse-muted">
        <UserIcon className="w-3.5 h-3.5 text-brand-accent" />
        <span className="font-semibold text-text-inverse-strong max-w-[120px] truncate hidden xl:inline">
          {user.fullName}
        </span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-dark border border-surface-dark-border text-brand-primary font-bold uppercase">
          {String(user.role)}
        </span>
      </div>

      <button
        type="button"
        onClick={handleLogout}
        title="Cerrar sesión"
        aria-label="Cerrar sesión"
        className="p-1.5 rounded-full text-text-inverse-muted hover:text-red-400 hover:bg-surface-dark transition-colors"
      >
        <LogOut className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

