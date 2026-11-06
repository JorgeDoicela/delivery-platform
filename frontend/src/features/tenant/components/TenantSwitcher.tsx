"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Check, ArrowRight, Store } from "lucide-react";
import {
  useCurrentTenantQuery,
  usePublicTenantsQuery,
} from "../hooks/useTenantQueries";
import { useTenantStore } from "../store/useTenantStore";

interface TenantSwitcherProps {
  variant?: "light" | "dark" | "auto";
}

export function TenantSwitcher({ variant = "auto" }: TenantSwitcherProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const tenantSlug = useTenantStore((s) => s.tenantSlug);
  const setTenantSlug = useTenantStore((s) => s.setTenantSlug);
  const { data: currentTenant } = useCurrentTenantQuery(tenantSlug);
  const { data: publicTenantsData } = usePublicTenantsQuery();

  const tenants = publicTenantsData?.tenants ?? [];

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

  const isExplicitDark = variant === "dark";
  const isExplicitLight = variant === "light";

  const buttonClasses = isExplicitDark
    ? "flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-surface-dark-border bg-surface-dark-hover hover:bg-surface-dark-hover/80 text-white transition-all text-xs font-bold active:scale-95 cursor-pointer"
    : isExplicitLight
    ? "flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-800 transition-all text-xs font-bold shadow-2xs active:scale-95 cursor-pointer"
    : "flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-surface-border bg-surface-canvas hover:bg-surface-card-hover text-text-strong transition-all text-xs font-bold shadow-2xs active:scale-95 cursor-pointer";

  const dropdownClasses = isExplicitDark
    ? "bg-surface-dark-card border-surface-dark-border text-white"
    : isExplicitLight
    ? "bg-white border-neutral-200 text-neutral-900"
    : "bg-surface-card border-surface-border text-text-strong";

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Explorar o cambiar de restaurante"
        aria-expanded={isOpen}
        className={buttonClasses}
      >
        {currentTenant ? (
          <>
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{
                backgroundColor: currentTenant.brandPrimaryColor || "#E4002B",
              }}
            />
            <span className="hidden sm:inline text-[10px] uppercase tracking-wider font-semibold text-text-muted">
              Restaurante:
            </span>
            <span className="font-display uppercase tracking-wide font-black text-xs max-w-[130px] truncate text-text-strong">
              {currentTenant.name}
            </span>
          </>
        ) : (
          <>
            <Store className="w-3.5 h-3.5 text-brand-primary shrink-0" />
            <span className="font-display uppercase tracking-wide font-black text-xs text-text-strong">
              Nuestras Marcas
            </span>
          </>
        )}
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 text-text-muted ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-xs sm:w-80 rounded-3xl border shadow-2xl p-3 z-50 space-y-2 ${dropdownClasses}`}
        >
          <div className="px-2 pt-1 pb-1.5 border-b border-surface-border">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
              Nuestras Marcas & Locales
            </span>
          </div>

          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {tenants.map((t) => {
              const isSelected = Boolean(tenantSlug && t.slug === tenantSlug);
              return (
                <button
                  key={t.slug}
                  type="button"
                  onClick={() => handleSelectTenant(t.slug)}
                  className={`w-full text-left p-2.5 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${
                    isSelected
                      ? "border-brand-primary bg-brand-primary-light/20 ring-1 ring-brand-primary/30"
                      : "border-surface-border hover:border-surface-border-subtle bg-surface-canvas hover:bg-surface-card-hover"
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white font-black text-xs uppercase"
                    style={{
                      backgroundColor: t.brandPrimaryColor || "#E4002B",
                    }}
                  >
                    {t.name.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-xs uppercase tracking-tight truncate text-text-strong">
                        {t.name}
                      </span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                      )}
                    </div>
                    <span className="text-[10px] block truncate text-text-muted">
                      {t.tagline || t.description}
                    </span>
                    <span className="text-[9px] font-mono block mt-0.5 text-text-subtle">
                      /{t.slug} • {t.activeBranchesCount} local(es)
                    </span>
                  </div>
                </button>
              );
            })}

            {tenants.length === 0 && (
              <div className="py-6 text-center text-xs text-text-muted">
                No hay otros restaurantes afiliados disponibles.
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-surface-border flex items-center justify-between px-2 text-[11px]">
            <span className="text-text-muted">Explorar directorio</span>
            <Link
              href="/#restaurantes"
              onClick={() => setIsOpen(false)}
              className="text-brand-primary font-bold hover:underline inline-flex items-center gap-1 font-display uppercase tracking-wider"
            >
              <span>Ver todos</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
