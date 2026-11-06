"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Radio } from "lucide-react";
import { useCurrentTenantQuery, useTenantStore } from "@/features/tenant";
import { AuthGuard, UserRole, useAuthStore } from "@/features/auth";
import { ThemeToggle } from "@/shared/components/ThemeToggle";

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenantSlug = useTenantStore((s) => s.tenantSlug);
  const setTenantSlug = useTenantStore((s) => s.setTenantSlug);
  const user = useAuthStore((s) => s.user);

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
            <div className="flex items-center gap-1.5 bg-status-success/15 text-status-success border border-status-success/30 px-2.5 sm:px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
              <Radio className="w-3 h-3 animate-pulse text-status-success shrink-0" />
              <span>GPS<span className="hidden sm:inline"> Satelital Activo</span></span>
            </div>

            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 p-3.5 sm:p-6 overflow-hidden flex flex-col bg-surface-canvas">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
