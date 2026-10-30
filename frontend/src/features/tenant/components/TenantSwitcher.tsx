"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import {
  useCurrentTenantQuery,
  usePublicTenantsQuery,
} from "../hooks/useTenantQueries";
import { useTenantStore } from "../store/useTenantStore";

export function TenantSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const tenantSlug = useTenantStore((s) => s.tenantSlug);
  const setTenantSlug = useTenantStore((s) => s.setTenantSlug);
  const { data: currentTenant } = useCurrentTenantQuery();
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
  };

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Cambiar de restaurante"
        aria-expanded={isOpen}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-800 transition-all text-xs font-bold shadow-2xs active:scale-95"
      >
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{
            backgroundColor: currentTenant?.brandPrimaryColor || "#E4002B",
          }}
        />
        <span className="hidden sm:inline text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">
          Restaurante:
        </span>
        <span className="font-display uppercase tracking-wide font-black text-xs text-neutral-900 max-w-[130px] truncate">
          {currentTenant?.name || "Seleccionar"}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-neutral-500 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-3xl border border-neutral-200 shadow-2xl p-3 z-50 space-y-2">
          <div className="px-2 pt-1 pb-1.5 border-b border-neutral-100 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Nuestras Marcas & Locales
            </span>
            <Link
              href="/admin/personalizacion"
              onClick={() => setIsOpen(false)}
              className="text-[10px] font-bold uppercase tracking-wider text-brand-primary hover:underline"
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
                  className={`w-full text-left p-2.5 rounded-2xl border transition-all flex items-start gap-3 ${
                    isSelected
                      ? "border-neutral-900 bg-neutral-950 text-white shadow-sm"
                      : "border-neutral-200/80 bg-white hover:bg-neutral-50 text-neutral-900"
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full mt-1 shrink-0 border border-white/30"
                    style={{ backgroundColor: t.brandPrimaryColor }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display font-black text-sm uppercase tracking-tight truncate">
                        {t.name}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          isSelected
                            ? "bg-white/15 text-white"
                            : "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        Envío ${t.baseDeliveryFee.toFixed(2)}
                      </span>
                    </div>
                    <p
                      className={`text-[11px] font-medium truncate ${
                        isSelected ? "text-neutral-300" : "text-neutral-500"
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
        </div>
      )}
    </div>
  );
}

