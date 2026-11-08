"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Volume2,
  ShieldCheck,
  X,
  Store,
  ExternalLink,
  Settings2,
} from "lucide-react";
import { TenantSwitcher } from "@/features/tenant";
import { ThemeToggle } from "@/shared/components/ThemeToggle";

interface DashboardMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  brandName: string;
  brandLogo: string;
  isSuperAdmin: boolean;
  storefrontHref: string;
}

export function DashboardMobileDrawer({
  isOpen,
  onClose,
  brandName,
  brandLogo,
  isSuperAdmin,
  storefrontHref,
}: DashboardMobileDrawerProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Ajustes y gobernanza de operaciones"
      className="fixed inset-0 z-50 md:hidden animate-in fade-in duration-200"
    >
      <div
        className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 w-[85vw] max-w-sm bg-surface-card border-l border-surface-border shadow-2xl flex flex-col justify-between p-5 sm:p-6 z-10 animate-in slide-in-from-right duration-300 overflow-y-auto">
        <div className="space-y-6">
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
                <span className="font-display font-black text-lg uppercase tracking-tight text-text-strong block leading-none truncate">
                  {brandName}
                </span>
                <span className="text-[9px] tracking-widest text-brand-primary font-bold uppercase block mt-0.5 truncate">
                  Ajustes Operativos
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

          {/* Selector de Tenant en Móvil (exclusivo para SuperAdmin) */}
          {isSuperAdmin && (
            <div className="p-3.5 bg-surface-canvas rounded-2xl border border-surface-border space-y-2">
              <div className="flex items-center gap-2 text-text-strong text-xs font-bold uppercase tracking-wider font-display">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Cambiar Marca Activa:</span>
              </div>
              <p className="text-[11px] text-text-muted">
                Selecciona la marca para filtrar pedidos, inventarios y sucursales.
              </p>
              <TenantSwitcher variant="auto" />
            </div>
          )}

          {/* Opciones y Configuración Operativa (Sin duplicar la barra inferior de módulos KDS/Stock/Locales) */}
          <div className="space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block px-1">
              Preferencias del Terminal
            </span>

            <div className="p-3.5 bg-surface-canvas rounded-2xl border border-surface-border flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Volume2 className="w-4 h-4 text-brand-accent shrink-0" />
                <div>
                  <span className="text-xs font-bold text-text-strong block">Alerta Sonora KDS</span>
                  <span className="text-[10px] text-text-muted block">Aviso automático de comandas</span>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-status-success/15 text-status-success border border-status-success/30 font-mono">
                Activa
              </span>
            </div>

            <div className="p-3.5 bg-surface-canvas rounded-2xl border border-surface-border flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Settings2 className="w-4 h-4 text-text-muted shrink-0" />
                <div>
                  <span className="text-xs font-bold text-text-strong block">Modo Pantalla Completa</span>
                  <span className="text-[10px] text-text-muted block">Optimizado para tablet / KDS</span>
                </div>
              </div>
              <span className="text-[10px] font-mono text-text-muted">
                F11
              </span>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-surface-border space-y-3">
          <Link
            href={storefrontHref}
            onClick={onClose}
            className="flex items-center justify-between px-4 py-3 rounded-2xl bg-surface-canvas hover:bg-surface-card-hover border border-surface-border text-text-strong text-xs font-bold uppercase tracking-wider font-display transition-colors min-h-[44px]"
          >
            <div className="flex items-center gap-2.5">
              <Store className="w-4 h-4 text-brand-primary" />
              <span>Ver Tienda Pública</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-text-muted" />
          </Link>

          <div className="flex items-center justify-between px-2 pt-1">
            <span className="text-[11px] text-text-muted font-medium">Tema:</span>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  );
}
