"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useCurrentTenantQuery, useTenantStore } from "@/features/tenant";
import { AuthGuard, UserRole, useAuthStore } from "@/features/auth";
import { ThemeToggle } from "@/shared/components/ThemeToggle";

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const tenantSlug = useTenantStore((s) => s.tenantSlug);
  const setTenantSlug = useTenantStore((s) => s.setTenantSlug);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  useEffect(() => {
    if (!tenantSlug) {
      setTenantSlug(user?.tenantSlug || "la-granjita");
    }
  }, [tenantSlug, user?.tenantSlug, setTenantSlug]);

  const { data: tenant } = useCurrentTenantQuery(tenantSlug || undefined);
  const brandName = tenant?.name || "La Granjita";
  const brandLogo = tenant?.logoUrl || "/images/shared/placeholders/logo-default.png";

  return (
    <AuthGuard allowedRoles={[UserRole.SuperAdmin, UserRole.Driver]}>
      <div className="flex flex-col min-h-screen bg-surface-canvas text-text-strong select-none transition-colors duration-200">
        <header className="h-16 bg-surface-card border-b border-surface-border px-3 sm:px-6 flex items-center justify-between shrink-0 shadow-xs transition-colors duration-200 gap-2">
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group min-w-0 shrink">
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 shrink-0">
              <Image
                src={brandLogo}
                alt={`Logo ${brandName}`}
                width={36}
                height={36}
                priority
                className="w-full h-full object-contain group-hover:scale-105 transition-transform"
              />
            </div>
            <div className="min-w-0">
              <span
                data-display-brand
                className="font-black text-lg tracking-tight text-text-strong block leading-none uppercase font-display truncate max-w-[120px] sm:max-w-none"
              >
                {brandName}
              </span>
              <span className="text-[9px] sm:text-[10px] tracking-widest text-brand-accent font-bold uppercase block mt-0.5 truncate hidden xs:block">
                Reparto Móvil • {tenant?.slug}
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <ThemeToggle />

            <button
              type="button"
              onClick={handleLogout}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
              className="p-2 sm:px-3 sm:py-1.5 rounded-full text-text-muted hover:text-red-500 hover:bg-surface-card-hover border border-surface-border transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px] font-bold uppercase tracking-wider">Salir</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-3.5 sm:p-6 overflow-hidden flex flex-col bg-surface-canvas">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
