"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Radio } from "lucide-react";
import { useCurrentTenantQuery } from "@/features/tenant";
import { AuthGuard, UserRole } from "@/features/auth";
import { ThemeToggle } from "@/shared/components/ThemeToggle";

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: tenant } = useCurrentTenantQuery();
  const brandName = tenant?.name || "La Granjita";
  const brandLogo = tenant?.logoUrl || "/images/shared/placeholders/logo-default.png";

  return (
    <AuthGuard allowedRoles={[UserRole.SuperAdmin, UserRole.Driver]}>
      <div className="flex flex-col min-h-screen bg-surface-canvas text-text-strong select-none transition-colors duration-200">
        <header className="h-16 bg-surface-card border-b border-surface-border px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-xs transition-colors duration-200">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9 shrink-0">
              <Image
                src={brandLogo}
                alt={`Logo ${brandName}`}
                width={36}
                height={36}
                priority
                className="w-full h-full object-contain group-hover:scale-105 transition-transform"
              />
            </div>
            <div>
              <span
                data-display-brand
                className="font-black text-lg tracking-tight text-text-strong block leading-none uppercase font-display"
              >
                {brandName}
              </span>
              <span className="text-[10px] tracking-widest text-brand-accent font-bold uppercase block mt-0.5">
                Reparto Móvil • {tenant?.slug}
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-status-success/15 text-status-success border border-status-success/30 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
              <Radio className="w-3 h-3 animate-pulse text-status-success" />
              <span>GPS Satelital Activo</span>
            </div>

            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-hidden flex flex-col bg-surface-canvas">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
