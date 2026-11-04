"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Utensils, Volume2, Package, Building2, Palette, ShieldCheck } from "lucide-react";
import { UserNav, useAuthStore, UserRole, AuthGuard } from "@/features/auth";
import { TenantSwitcher, useCurrentTenantQuery } from "@/features/tenant";
import { ThemeToggle } from "@/shared/components/ThemeToggle";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: tenant } = useCurrentTenantQuery();
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = Boolean(
    user &&
      (user.role === "SuperAdmin" ||
        user.role === UserRole.SuperAdmin ||
        user.roles?.includes("SuperAdmin") ||
        Number(user.role) === 1)
  );
  const canManageFranchise =
    isSuperAdmin ||
    Boolean(
      user &&
        (user.role === "TenantAdmin" ||
          user.role === UserRole.TenantAdmin ||
          user.role === "BranchManager" ||
          user.role === UserRole.BranchManager ||
          user.roles?.includes("TenantAdmin") ||
          user.roles?.includes("BranchManager") ||
          Number(user.role) === 2 ||
          Number(user.role) === 3)
    );
  const brandName = tenant?.name || "La Granjita";
  const brandLogo = tenant?.logoUrl || "/images/shared/placeholders/logo-default.png";

  return (
    <AuthGuard
      allowedRoles={[
        UserRole.SuperAdmin,
        UserRole.TenantAdmin,
        UserRole.BranchManager,
        UserRole.Cashier,
        UserRole.KitchenStaff,
      ]}
    >
      <div className="flex flex-col min-h-screen bg-surface-canvas text-text-strong transition-colors duration-200">
        <header className="h-16 bg-surface-card border-b border-surface-border px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-xs transition-colors duration-200">
          <div className="flex items-center gap-6">
            <Link href="/cocina" className="flex items-center gap-3 group">
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
                  className="font-black text-xl tracking-tight text-text-strong block leading-none uppercase font-display"
                >
                  {brandName}
                </span>
                <span className="text-[10px] tracking-widest text-brand-primary font-bold uppercase block mt-0.5">
                  Operaciones & Cocina
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider font-display">
              <Link
                href="/cocina"
                className="px-3.5 py-1.5 rounded-full text-text-muted hover:text-text-strong hover:bg-surface-card-hover transition-colors flex items-center gap-1.5"
              >
                <Utensils className="w-3.5 h-3.5 text-brand-primary" />
                <span>Cocina KDS</span>
              </Link>

              {canManageFranchise && (
                <>
                  <Link
                    href="/admin/inventario"
                    className="px-3.5 py-1.5 rounded-full text-text-muted hover:text-text-strong hover:bg-surface-card-hover transition-colors flex items-center gap-1.5"
                  >
                    <Package className="w-3.5 h-3.5 text-brand-accent" />
                    <span>Inventario</span>
                  </Link>

                  <Link
                    href="/admin/sucursales"
                    className="px-3.5 py-1.5 rounded-full text-text-muted hover:text-text-strong hover:bg-surface-card-hover transition-colors flex items-center gap-1.5"
                  >
                    <Building2 className="w-3.5 h-3.5 text-status-info" />
                    <span>Sucursales</span>
                  </Link>

                  <Link
                    href="/admin/personalizacion"
                    className="px-3.5 py-1.5 rounded-full text-text-muted hover:text-text-strong hover:bg-surface-card-hover transition-colors flex items-center gap-1.5"
                  >
                    <Palette className="w-3.5 h-3.5 text-brand-primary" />
                    <span>Marca & Landing</span>
                  </Link>
                </>
              )}

              {isSuperAdmin && (
                <Link
                  href="/superadmin"
                  className="px-3.5 py-1.5 rounded-full text-text-muted hover:text-text-strong hover:bg-surface-card-hover transition-colors flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Gobernanza de Marcas</span>
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 text-xs">
            {isSuperAdmin && <TenantSwitcher variant="auto" />}

            <div className="hidden sm:flex items-center gap-2 bg-surface-canvas px-3 py-1 rounded-full border border-surface-border text-[11px] font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-status-success shrink-0" />
              <span className="text-status-success">
                SignalR Activo
              </span>
            </div>

            <div className="hidden lg:flex items-center gap-1.5 text-text-muted bg-surface-canvas px-3 py-1 rounded-full border border-surface-border text-[11px] font-bold uppercase tracking-wider">
              <Volume2 className="w-3.5 h-3.5 text-brand-accent" />
              <span>Alarma</span>
            </div>

            <Link
              href={`/${tenant?.slug || "la-granjita"}`}
              className="text-xs font-bold uppercase tracking-wider text-text-strong hover:text-brand-primary transition-colors px-3 py-1.5 rounded-full bg-surface-canvas hover:bg-surface-card-hover border border-surface-border font-display"
            >
              <span>Ver Tienda</span>
            </Link>

            <ThemeToggle />

            <UserNav />
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-hidden flex flex-col bg-surface-canvas transition-colors duration-200">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
