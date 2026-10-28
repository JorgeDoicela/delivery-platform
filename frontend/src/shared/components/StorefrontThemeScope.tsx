"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function StorefrontThemeScope({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  let themeClass = "theme-typography-opt1";
  let activeOption = 1;
  let optionName = "Opción 1: Barlow Condensed (Titulares) + Inter (Cuerpo) + Geist Mono (Precios)";

  if (pathname?.startsWith("/checkout")) {
    themeClass = "theme-typography-opt2";
    activeOption = 2;
    optionName = "Opción 2: Outfit (Titulares) + Inter (Cuerpo) + Geist Mono (Precios)";
  } else if (pathname?.startsWith("/track")) {
    themeClass = "theme-typography-opt3";
    activeOption = 3;
    optionName = "Opción 3: Antonio (Titulares) + Nunito (Cuerpo) + Geist Mono (Precios)";
  }

  return (
    <div className={`flex flex-col min-h-screen bg-surface-canvas ${themeClass}`}>
      {/* Barra de Control de Comparativa Tipográfica */}
      <div className="bg-surface-dark text-text-inverse-strong border-b border-surface-dark-border py-2 px-4 text-xs select-none sticky top-0 z-50 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase font-bold text-brand-primary bg-brand-primary-muted px-2 py-0.5 rounded border border-brand-primary/30 shrink-0">
              Test Tipográfico Activo
            </span>
            <span className="text-text-inverse-base text-xs font-medium truncate">
              {optionName}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Link
              href="/"
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                activeOption === 1
                  ? "bg-brand-primary text-text-inverse-strong shadow-sm"
                  : "bg-surface-dark-card hover:bg-surface-dark-hover text-text-inverse-muted hover:text-text-inverse-strong border border-surface-dark-border"
              }`}
            >
              1. Home (Barlow)
            </Link>
            <Link
              href="/checkout"
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                activeOption === 2
                  ? "bg-brand-primary text-text-inverse-strong shadow-sm"
                  : "bg-surface-dark-card hover:bg-surface-dark-hover text-text-inverse-muted hover:text-text-inverse-strong border border-surface-dark-border"
              }`}
            >
              2. Checkout (Outfit)
            </Link>
            <Link
              href="/track"
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                activeOption === 3
                  ? "bg-brand-primary text-text-inverse-strong shadow-sm"
                  : "bg-surface-dark-card hover:bg-surface-dark-hover text-text-inverse-muted hover:text-text-inverse-strong border border-surface-dark-border"
              }`}
            >
              3. Track (Antonio)
            </Link>
          </div>
        </div>
      </div>

      {children}
    </div>
  );
}
