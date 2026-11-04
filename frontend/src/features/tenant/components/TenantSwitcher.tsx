"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import {
  useCurrentTenantQuery,
  usePublicTenantsQuery,
} from "../hooks/useTenantQueries";
import { useTenantStore } from "../store/useTenantStore";

interface TenantSwitcherProps {
  variant?: "light" | "dark";
}

export function TenantSwitcher({ variant = "dark" }: TenantSwitcherProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const tenantSlug = useTenantStore((s) => s.tenantSlug);
  const setTenantSlug = useTenantStore((s) => s.setTenantSlug);
  const { data: currentTenant } = useCurrentTenantQuery();
  const { data: publicTenantsData } = usePublicTenantsQuery();

  const tenants = publicTenantsData?.tenants ?? [];
  const isDark = variant === "dark";

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  const handleSelectTenant = (slug: string) => {
    setTenantSlug(slug);
    setIsOpen(false);
    router.push(`/${slug}`);
  };

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Cambiar de restaurante"
        aria-expanded={isOpen}
        className={
          isDark
            ? "flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-surface-dark-border bg-surface-dark-hover hover:bg-surface-dark-hover/80 text-white transition-all text-xs font-bold active:scale-95 cursor-pointer"
            : "flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-800 transition-all text-xs font-bold shadow-2xs active:scale-95 cursor-pointer"
        }
      >
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{
            backgroundColor: currentTenant?.brandPrimaryColor || "#E4002B",
          }}
        />
        <span
          className={`hidden sm:inline text-[10px] uppercase tracking-wider font-semibold ${
            isDark ? "text-text-inverse-muted" : "text-neutral-500"
          }`}
        >
          Restaurante:
        </span>
        <span
          className={`font-display uppercase tracking-wide font-black text-xs max-w-[130px] truncate ${
            isDark ? "text-white" : "text-neutral-900"
          }`}
        >
          {currentTenant?.name || "Seleccionar"}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${
            isDark ? "text-text-inverse-muted" : "text-neutral-500"
          } ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 mt-2 w-80 rounded-3xl border shadow-2xl p-3 z-50 space-y-2 ${
            isDark
              ? "bg-surface-dark-card border-surface-dark-border text-white"
              : "bg-white border-neutral-200 text-neutral-900"
          }`}
        >
          <div
            className={`px-2 pt-1 pb-1.5 border-b flex items-center justify-between ${
              isDark ? "border-surface-dark-border" : "border-neutral-100"
            }`}
          >
            <span
              className={`text-[10px] font-bold uppercase tracking-wider ${
                isDark ? "text-text-inverse-muted" : "text-neutral-500"
              }`}
            >
              Nuestras Marcas & Locales
            </span>
            <Link
              href="/admin/personalizacion"
              onClick={() => setIsOpen(false)}
              className="text-[10px] font-bold uppercase tracking-wider text-brand-primary hover:underline font-display"
            >
              Gestionar Marca
            </Link>
          </div>

          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {tenants.map((t) => {
              const isSelected = t.slug === tenantSlug;
              return (
                <button
                  key={t.slug}
                  type="button"
                  onClick={() => handleSelectTenant(t.slug)}
                  className={`w-full text-left p-2.5 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${
                    isSelected
                      ? isDark
                        ? "border-brand-primary bg-surface-dark text-white shadow-sm"
                        : "border-neutral-900 bg-neutral-950 text-white shadow-sm"
                      : isDark
                      ? "border-surface-dark-border bg-surface-dark-card hover:bg-surface-dark-hover text-white"
                      : "border-neutral-200/80 bg-white hover:bg-neutral-50 text-neutral-900"
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full mt-1 shrink-0"
                    style={{ backgroundColor: t.brandPrimaryColor }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display font-black text-sm uppercase tracking-tight truncate">
                        {t.name}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-text-inverse-muted">
                        ${t.baseDeliveryFee.toFixed(2)}
                      </span>
                    </div>
                    <p
                      className={`text-[11px] font-medium truncate ${
                        isSelected
                          ? isDark
                            ? "text-brand-accent"
                            : "text-neutral-300"
                          : isDark
                          ? "text-text-inverse-muted"
                          : "text-neutral-500"
                      }`}
                    >
                      {t.tagline} • {t.activeBranchesCount}{" "}
                      {t.activeBranchesCount === 1 ? "sucursal" : "sucursales"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div
            className={`pt-2 border-t flex items-center justify-between px-2 ${
              isDark ? "border-surface-dark-border" : "border-neutral-100"
            }`}
          >
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className={`text-[11px] font-bold uppercase tracking-wider transition-colors ${
                isDark
                  ? "text-text-inverse-muted hover:text-white"
                  : "text-neutral-600 hover:text-brand-primary"
              }`}
            >
              Directorio SaaS
            </Link>
            <Link
              href="/superadmin"
              onClick={() => setIsOpen(false)}
              className="text-[11px] font-bold uppercase tracking-wider text-brand-primary hover:underline"
            >
              Consola Global
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
