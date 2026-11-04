"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, MapPin, Check, Clock } from "lucide-react";
import { useCartStore } from "@/features/cart";
import type { TenantStorefrontConfigDto } from "@/shared/types/api";

interface TenantBranchSelectorProps {
  tenant?: TenantStorefrontConfigDto | null;
}

export function TenantBranchSelector({ tenant }: TenantBranchSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const cartBranchId = useCartStore((s) => s.branchId);
  const setBranch = useCartStore((s) => s.setBranch);

  const branches = tenant?.branches ?? [];
  const currentBranch =
    branches.find((b) => b.id === cartBranchId) || branches[0];

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

  if (branches.length <= 1) {
    return null;
  }

  const handleSelect = (branchId: number, branchName: string) => {
    setBranch(branchId, branchName);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Cambiar sucursal de atención"
        aria-expanded={isOpen}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-800 transition-all text-xs font-bold shadow-2xs active:scale-95"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
        <span className="hidden sm:inline text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">
          Sucursal:
        </span>
        <span className="font-display uppercase tracking-wide font-black text-xs text-neutral-900 max-w-[130px] truncate">
          {currentBranch?.name || "Seleccionar"}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-neutral-500 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-3xl border border-neutral-200 shadow-2xl p-3.5 z-50 space-y-2">
          <div className="px-2 pt-1 pb-2 border-b border-neutral-100 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Sucursales de {tenant?.name || "este local"}
            </span>
            <span className="text-[10px] font-mono text-emerald-600 font-bold">
              {branches.length} activas
            </span>
          </div>

          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {branches.map((b) => {
              const isSelected = b.id === currentBranch?.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => handleSelect(b.id, b.name)}
                  className={`w-full text-left p-3 rounded-2xl transition-all border flex items-start justify-between gap-3 ${
                    isSelected
                      ? "bg-neutral-900 text-white border-neutral-900 shadow-sm"
                      : "bg-white text-neutral-900 border-neutral-200/80 hover:bg-neutral-50"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-black text-xs uppercase tracking-wide">
                        {b.name}
                      </span>
                    </div>
                    <p
                      className={`text-[11px] leading-snug flex items-start gap-1.5 ${
                        isSelected ? "text-neutral-300" : "text-neutral-500"
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-brand-primary" />
                      <span>{b.address}</span>
                    </p>
                    <p
                      className={`text-[10px] font-mono flex items-center gap-1.5 pt-0.5 ${
                        isSelected ? "text-neutral-400" : "text-neutral-400"
                      }`}
                    >
                      <Clock className="w-3 h-3 shrink-0" />
                      <span>
                        {b.openingTime} a {b.closingTime}
                      </span>
                    </p>
                  </div>

                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-brand-primary text-white flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-neutral-100 px-2 flex items-center justify-between text-[11px]">
            <a
              href="#sucursales"
              onClick={() => setIsOpen(false)}
              className="font-bold text-brand-primary hover:underline"
            >
              Ver mapa y horarios completos →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

