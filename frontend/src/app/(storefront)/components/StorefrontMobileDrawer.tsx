"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
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
import { UserRole, isUserInRole } from "@/features/auth";
import type { TenantStorefrontConfigDto } from "@/shared/types/api";
import type { AuthenticatedUserLike } from "@/features/auth/lib/redirectByRole";
import type { TenantRoutingResolution } from "@/shared/lib/tenant-routing";

const ACCOUNT_NAV_ITEMS: Array<{
  id: AccountTab;
  label: string;
  icon: typeof UserIcon;
  customerOnly?: boolean;
}> = [
  { id: "perfil", label: "Datos Personales", icon: UserIcon },
  { id: "pedidos", label: "Historial de Pedidos", icon: Package, customerOnly: true },
  { id: "direcciones", label: "Direcciones Guardadas", icon: MapPin, customerOnly: true },
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
  user,
  operationalHref,
  operationalLabel,
  onLogout,
}: StorefrontMobileDrawerProps) {
  const isStaffOrAdmin =
    isUserInRole(user, UserRole.SuperAdmin) ||
    isUserInRole(user, UserRole.TenantAdmin) ||
    isUserInRole(user, UserRole.BranchManager) ||
    isUserInRole(user, UserRole.KitchenStaff) ||
    isUserInRole(user, UserRole.Cashier) ||
    isUserInRole(user, UserRole.Driver);

  const visibleAccountItems = isStaffOrAdmin
    ? ACCOUNT_NAV_ITEMS.filter((item) => !item.customerOnly)
    : ACCOUNT_NAV_ITEMS;

  React.useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = "hidden";
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const pathname = usePathname();
  const isLoginActive =
    Boolean(pathname?.includes("/login")) ||
    Boolean(pathname?.includes("/registro")) ||
    Boolean(pathname?.includes("/recuperar")) ||
    Boolean(pathname?.includes("/cuenta"));
  const isSucursalesActive =
    Boolean(pathname?.includes("/sucursal")) ||
    Boolean(pathname?.includes("/sucursales"));
  const isTermsActive = Boolean(pathname?.includes("/terminos"));
  const isPrivacyActive = Boolean(pathname?.includes("/privacidad"));

  const hasMultipleBranches =
    isPlatformRoot || Boolean(tenant?.branches && tenant.branches.length > 1);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Menú de navegación móvil"
      aria-hidden={!isOpen}
      className={`fixed inset-0 z-50 xl:hidden overflow-hidden transition-[visibility] duration-300 ${
        isOpen ? "visible pointer-events-auto" : "invisible pointer-events-none"
      }`}
    >
      {/* Backdrop difuminado con fade suave y blur de cristal */}
      <div
        className={`fixed inset-0 bg-neutral-950/60 backdrop-blur-sm transition-opacity duration-300 ease-out ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel deslizante lateral con curva spring táctil suave */}
      <div
        className={`fixed inset-y-0 left-0 w-[85vw] max-w-xs sm:max-w-sm bg-surface-card border-r border-surface-border shadow-2xl flex flex-col justify-between z-10 will-change-transform transition-transform duration-300 ${
          isOpen
            ? "translate-x-0 ease-[cubic-bezier(0.16,1,0.3,1)]"
            : "-translate-x-full ease-in"
        }`}
      >
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
              {visibleAccountItems.map((item) => {
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
                className="flex items-center justify-between px-4 py-2.5 rounded-full bg-brand-primary text-white text-xs font-black uppercase tracking-wider font-display hover:bg-brand-primary-hover transition-colors shadow-xs"
              >
                <span>Ir a {operationalLabel}</span>
                <span className="text-xs">&rarr;</span>
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
                className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl hover:bg-surface-canvas font-display font-black text-sm uppercase tracking-wide transition-colors ${
                  isSucursalesActive
                    ? "text-brand-primary"
                    : "text-text-strong hover:text-brand-primary"
                }`}
              >
                <Building2 className="w-4 h-4 text-brand-primary shrink-0" />
                <span>Sucursales & Cobertura</span>
              </Link>
            )}

            <Link
              href={routes.getTermsHref()}
              onClick={onClose}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl hover:bg-surface-canvas font-display font-black text-sm uppercase tracking-wide transition-colors ${
                isTermsActive
                  ? "text-brand-primary"
                  : "text-text-strong hover:text-brand-primary"
              }`}
            >
              <FileText className="w-4 h-4 text-brand-primary shrink-0" />
              <span>Términos y Condiciones</span>
            </Link>

            <Link
              href={routes.getPrivacyHref()}
              onClick={onClose}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl hover:bg-surface-canvas font-display font-black text-sm uppercase tracking-wide transition-colors ${
                isPrivacyActive
                  ? "text-brand-primary"
                  : "text-text-strong hover:text-brand-primary"
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-brand-primary shrink-0" />
              <span>Aviso de Privacidad</span>
            </Link>
          </nav>
        </div>

        {/* Pie del Drawer */}
        <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-1 space-y-1 shrink-0">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={async () => {
                await onLogout();
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl hover:bg-surface-canvas text-text-strong hover:text-brand-primary font-display font-black text-sm uppercase tracking-wide transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-brand-primary shrink-0" />
              <span>Cerrar Sesión</span>
            </button>
          ) : (
            <Link
              href={routes.getLoginHref()}
              onClick={onClose}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl hover:bg-surface-canvas font-display font-black text-sm uppercase tracking-wide transition-colors ${
                isLoginActive
                  ? "text-brand-primary"
                  : "text-text-strong hover:text-brand-primary"
              }`}
            >
              <UserIcon className="w-4 h-4 text-brand-primary shrink-0" />
              <span>Mi Perfil / Iniciar Sesión</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

