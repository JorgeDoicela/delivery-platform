"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronDown,
  LogOut,
  Store,
  User as UserIcon,
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { UserRole } from "../types";
import { isUserInRole } from "../lib/redirectByRole";
import { useIsMounted } from "@/shared/hooks/useIsMounted";
import { useTenantRoutes } from "@/shared/lib/tenant-routing";
import { getApiBaseUrl } from "@/shared/lib/api-client";

interface UserNavProps {
  tenantSlug?: string;
  showGuestLogin?: boolean;
}

export function UserNav({ tenantSlug, showGuestLogin = true }: UserNavProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const isMounted = useIsMounted();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const routes = useTenantRoutes(tenantSlug || user?.tenantSlug);

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setIsOpen(false);
  }

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (!isMounted) {
    return null;
  }

  const isAuthActive =
    Boolean(pathname?.includes("/login")) ||
    Boolean(pathname?.includes("/registro")) ||
    Boolean(pathname?.includes("/recuperar")) ||
    Boolean(pathname?.includes("/reset")) ||
    Boolean(pathname?.includes("/verificar")) ||
    Boolean(pathname?.includes("/cuenta"));

  if (!isAuthenticated || !user) {
    if (!showGuestLogin) return null;
    return (
      <Link
        href={routes.getLoginHref()}
        className={`hidden sm:flex p-1.5 sm:p-2 rounded-full transition-colors items-center justify-center shrink-0 active:scale-95 ${
          isAuthActive
            ? "text-brand-primary"
            : "text-text-strong hover:text-brand-primary"
        }`}
        title="Iniciar Sesión"
        aria-label="Iniciar Sesión"
      >
        <UserIcon
          className={`w-5 h-5 transition-colors stroke-[1.8] ${
            isAuthActive ? "text-brand-primary" : "text-text-strong hover:text-brand-primary"
          }`}
        />
      </Link>
    );
  }

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    router.push(routes.getLoginHref());
    router.refresh();
  };

  const avatarSrc = user.avatarUrl
    ? user.avatarUrl.startsWith("http")
      ? user.avatarUrl
      : `${getApiBaseUrl()}${user.avatarUrl.startsWith("/") ? user.avatarUrl : `/${user.avatarUrl}`}`
    : null;

  const isAccountActive = pathname?.includes("/cuenta");
  const isCashierOrKitchen =
    isUserInRole(user, UserRole.Cashier) ||
    isUserInRole(user, UserRole.KitchenStaff);

  const initials = (user.fullName || "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        title={`Cuenta (${user.fullName})`}
        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-full text-xs transition-colors cursor-pointer ${
          isOpen
            ? "bg-surface-card-hover text-brand-primary"
            : isAccountActive
              ? "text-brand-primary"
              : "text-text-base hover:text-text-strong hover:bg-surface-card-hover"
        }`}
      >
        <div className="w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-[10px] overflow-hidden shrink-0">
          {avatarSrc ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={avatarSrc}
              alt={user.fullName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-[10px] font-black tracking-tight text-white">
              {initials}
            </span>
          )}
        </div>
        <span
          className={`font-semibold max-w-[120px] truncate hidden sm:inline ${
            isAccountActive ? "text-brand-primary font-bold" : "text-text-strong"
          }`}
        >
          {user.fullName}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-text-muted transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 rounded-2xl bg-surface-card border border-surface-border shadow-xl p-1.5 z-50 space-y-0.5"
        >
          <div className="px-3 py-2">
            <p className="text-xs font-bold text-text-strong truncate">
              {user.fullName}
            </p>
            {user.email && (
              <p className="text-[11px] text-text-muted truncate mt-0.5">
                {user.email}
              </p>
            )}
          </div>

          <Link
            href={routes.getAccountHref()}
            role="menuitem"
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              isAccountActive
                ? "text-brand-primary bg-surface-canvas font-bold"
                : "text-text-strong hover:bg-surface-canvas hover:text-brand-primary"
            }`}
          >
            <UserIcon className="w-3.5 h-3.5 text-brand-primary shrink-0" />
            <span>Mi Perfil</span>
          </Link>

          {isCashierOrKitchen && (
            <Link
              href={routes.getHomeHref()}
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-text-strong hover:bg-surface-canvas hover:text-brand-primary transition-colors"
            >
              <Store className="w-3.5 h-3.5 text-text-muted shrink-0" />
              <span>Ver Tienda</span>
            </Link>
          )}

          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-text-muted hover:text-red-500 hover:bg-surface-canvas transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      )}
    </div>
  );
}
