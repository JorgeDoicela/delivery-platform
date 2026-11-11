"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  User as UserIcon,
  Package,
  MapPin,
  Shield,
  Lock,
  X,
  Building2,
  FileText,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { TenantBranchSelector, TenantSwitcher } from "@/features/tenant";
import { useAccountStore, type AccountTab } from "@/features/account";
import type { TenantStorefrontConfigDto } from "@/shared/types/api";
import type { AuthenticatedUserLike } from "@/features/auth/lib/redirectByRole";
import type { TenantRoutingResolution } from "@/shared/lib/tenant-routing";

const ACCOUNT_NAV_ITEMS: Array<{ id: AccountTab; label: string; icon: typeof UserIcon }> = [
  { id: "perfil", label: "Datos Personales", icon: UserIcon },
  { id: "pedidos", label: "Historial de Pedidos", icon: Package },
  { id: "direcciones", label: "Direcciones Guardadas", icon: MapPin },
  { id: "privacidad", label: "Privacidad (LOPDP)", icon: Shield },
  { id: "seguridad", label: "Seguridad y Clave", icon: Lock },
];

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
  operationalHref,
  operationalLabel,
  onLogout,
}: StorefrontMobileDrawerProps) {
  if (!isOpen) return null;

  const hasMultipleBranches =
    isPlatformRoot || Boolean(tenant?.branches && tenant.branches.length > 1);

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

      <div className="fixed inset-y-0 left-0 w-[85vw] max-w-sm bg-surface-card border-r border-surface-border shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-left duration-300">
        {/* Cabecera del Drawer */}
        <div className="h-[52px] sm:h-[76px] px-4 sm:px-6 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5 group min-w-0 shrink">
            <div className="relative w-7 h-7 sm:w-10 sm:h-10 shrink-0">
              <Image
                src={brandLogo}
                alt={`Logo ${brandName}`}
                width={40}
                height={40}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <span
                data-display-brand
                className="font-black text-lg sm:text-[26px] tracking-tight text-brand-primary block leading-none uppercase font-display truncate max-w-[150px] sm:max-w-none"
                suppressHydrationWarning
              >
                {brandName}
              </span>
              <span
                className="text-[9px] sm:text-[10px] tracking-widest text-text-muted font-bold uppercase mt-0.5 truncate hidden sm:block"
                suppressHydrationWarning
              >
                {brandTagline}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 -mr-1 sm:-mr-2 rounded-full text-text-strong hover:bg-surface-card-hover cursor-pointer shrink-0 transition-colors"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Contenido scrolleable del Drawer */}
        <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4 space-y-5">
          {/* Selector de Comercio o Sucursal en Móvil (solo si hay más de 1 sucursal o en raíz de plataforma) */}
          {hasMultipleBranches && (
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
          )}

          {/* Enlaces de Mi Cuenta (Solo visible cuando el usuario está autenticado) */}
          {isAuthenticated && (
            <nav className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block px-3 py-1">
                Mi Cuenta
              </span>
              {ACCOUNT_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.id}
                    href={`${routes.getAccountHref()}?tab=${item.id}`}
                    onClick={() => {
                      useAccountStore.getState().setActiveTab(item.id);
                      onClose();
                    }}
                    className="flex items-center gap-3 px-3.5 py-3 rounded-2xl hover:bg-surface-canvas text-text-strong hover:text-brand-primary font-display font-black text-sm uppercase tracking-wide transition-colors"
                  >
                    <Icon className="w-4 h-4 text-brand-primary shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Acceso a Panel Operativo para Staff / Admin */}
          {operationalHref && (
            <div className="pt-1">
              <Link
                href={operationalHref}
                onClick={onClose}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider font-display hover:bg-neutral-800 transition-colors"
              >
                <span>Ir a {operationalLabel}</span>
                <span className="text-[10px] text-brand-primary">&rarr;</span>
              </Link>
            </div>
          )}

          {/* Enlaces de Información y Soporte (Sin duplicar la barra fija inferior) */}
          <nav className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block px-3 py-1">
              {hasMultipleBranches ? "Información & Locales" : "Información"}
            </span>

            {hasMultipleBranches && (
              <Link
                href={routes.getSucursalesHref()}
                onClick={onClose}
                className="flex items-center gap-3 px-3.5 py-3 rounded-2xl hover:bg-surface-canvas text-text-strong hover:text-brand-primary font-display font-black text-sm uppercase tracking-wide transition-colors"
              >
                <Building2 className="w-4 h-4 text-brand-primary shrink-0" />
                <span>Sucursales & Cobertura</span>
              </Link>
            )}

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
        <div className="p-4 sm:p-6 pt-3 sm:pt-4 border-t border-surface-border space-y-2 shrink-0">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={async () => {
                await onLogout();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-surface-canvas hover:bg-surface-card-hover border border-surface-border text-text-strong hover:text-brand-primary text-xs font-bold uppercase tracking-wider font-display transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-brand-primary shrink-0" />
              <span>Cerrar Sesión</span>
            </button>
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
        </div>
      </div>
    </div>
  );
}

