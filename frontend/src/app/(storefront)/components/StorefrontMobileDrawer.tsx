"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  User as UserIcon,
  X,
  Building2,
  FileText,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { TenantBranchSelector, TenantSwitcher } from "@/features/tenant";
import type { TenantStorefrontConfigDto } from "@/shared/types/api";
import type { AuthenticatedUserLike } from "@/features/auth/lib/redirectByRole";
import type { TenantRoutingResolution } from "@/shared/lib/tenant-routing";
import { ThemeToggle } from "@/shared/components/ThemeToggle";

interface StorefrontMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  brandName: string;
  brandTagline: string;
  brandLogo: string;
  isPlatformRoot: boolean;
  routes: TenantRoutingResolution;
  tenant?: TenantStorefrontConfigDto | null;
  isAuthenticated: boolean;
  user: AuthenticatedUserLike | null | undefined;
  operationalHref: string | null;
  operationalLabel: string | null;
  onLogout: () => Promise<void>;
}

export function StorefrontMobileDrawer({
  isOpen,
  onClose,
  brandName,
  brandTagline,
  brandLogo,
  isPlatformRoot,
  routes,
  tenant,
  isAuthenticated,
  user,
  operationalHref,
  operationalLabel,
  onLogout,
}: StorefrontMobileDrawerProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Menú de navegación móvil"
      className="fixed inset-0 z-50 xl:hidden animate-in fade-in duration-200"
    >
      <div
        className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 left-0 w-[85vw] max-w-sm bg-surface-card border-r border-surface-border shadow-2xl flex flex-col justify-between p-5 sm:p-6 z-10 animate-in slide-in-from-left duration-300 overflow-y-auto">
        <div className="space-y-6">
          {/* Cabecera del Drawer */}
          <div className="flex items-center justify-between pb-4 border-b border-surface-border">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative w-8 h-8 shrink-0">
                <Image
                  src={brandLogo}
                  alt={`Logo ${brandName}`}
                  width={32}
                  height={32}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <span className="font-display font-black text-xl uppercase tracking-tight text-brand-primary block leading-none truncate">
                  {brandName}
                </span>
                <span className="text-[9px] tracking-widest text-text-muted font-bold uppercase block mt-0.5 truncate">
                  {brandTagline}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center text-text-muted hover:text-text-strong hover:bg-surface-card-hover transition-colors cursor-pointer shrink-0"
              aria-label="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Selector de Comercio o Sucursal en Móvil */}
          <div className="sm:hidden">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1.5">
              {isPlatformRoot ? "Directorio de Marcas:" : "Sucursal Activa:"}
            </span>
            {isPlatformRoot ? (
              <TenantSwitcher variant="auto" />
            ) : (
              <TenantBranchSelector tenant={tenant} />
            )}
          </div>

          {/* Enlaces de Información y Soporte (Sin duplicar la barra fija inferior) */}
          <nav className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block px-3 py-1">
              Información & Locales
            </span>

            <Link
              href={routes.getSucursalesHref()}
              onClick={onClose}
              className="flex items-center gap-3 px-3.5 py-3 rounded-2xl hover:bg-surface-canvas text-text-strong hover:text-brand-primary font-display font-black text-sm uppercase tracking-wide transition-colors"
            >
              <Building2 className="w-4 h-4 text-brand-primary shrink-0" />
              <span>Sucursales & Cobertura</span>
            </Link>

            <Link
              href={routes.getTermsHref()}
              onClick={onClose}
              className="flex items-center gap-3 px-3.5 py-3 rounded-2xl hover:bg-surface-canvas text-text-strong hover:text-brand-primary font-display font-black text-sm uppercase tracking-wide transition-colors"
            >
              <FileText className="w-4 h-4 text-brand-primary shrink-0" />
              <span>Términos y Condiciones</span>
            </Link>

            <Link
              href={routes.getPrivacyHref()}
              onClick={onClose}
              className="flex items-center gap-3 px-3.5 py-3 rounded-2xl hover:bg-surface-canvas text-text-strong hover:text-brand-primary font-display font-black text-sm uppercase tracking-wide transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-brand-primary shrink-0" />
              <span>Aviso de Privacidad</span>
            </Link>
          </nav>
        </div>

        {/* Pie del Drawer */}
        <div className="pt-5 border-t border-surface-border space-y-3">
          {isAuthenticated && user ? (
            <div className="p-3 bg-surface-canvas rounded-2xl border border-surface-border space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <span className="font-bold text-xs text-text-strong block truncate">
                    {user.fullName || "Usuario Conectado"}
                  </span>
                  <span className="text-[10px] text-brand-primary font-mono font-bold uppercase block truncate">
                    Rol: {String(user.role)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await onLogout();
                    onClose();
                  }}
                  className="p-1.5 rounded-full text-text-muted hover:text-red-500 hover:bg-surface-card-hover transition-colors cursor-pointer shrink-0"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              {operationalHref && (
                <Link
                  href={operationalHref}
                  onClick={onClose}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider font-display hover:bg-neutral-800 transition-colors"
                >
                  <span>Ir a {operationalLabel}</span>
                  <span className="text-[10px] text-brand-primary">&rarr;</span>
                </Link>
              )}

              <Link
                href={routes.getAccountHref()}
                onClick={onClose}
                className="flex items-center justify-between px-3 py-1.5 rounded-xl text-[11px] font-semibold text-text-muted hover:text-text-strong transition-colors"
              >
                <span>Configurar mi Cuenta</span>
                <span className="text-[10px]">&rarr;</span>
              </Link>
            </div>
          ) : (
            <Link
              href={routes.getLoginHref()}
              onClick={onClose}
              className="flex items-center justify-between px-4 py-3 rounded-2xl bg-surface-canvas hover:bg-surface-card-hover border border-surface-border text-text-strong text-xs font-bold uppercase tracking-wider font-display transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <UserIcon className="w-4 h-4 text-brand-primary" />
                <span>Mi Perfil / Iniciar Sesión</span>
              </div>
              <span className="text-[10px] text-text-muted">&rarr;</span>
            </Link>
          )}

          <div className="flex items-center justify-between px-2 pt-1">
            <span className="text-[11px] text-text-muted font-medium">Tema Visual:</span>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  );
}

