"use client";

import React, { useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { useThemeStore } from "../store/useThemeStore";
import { useIsMounted } from "../hooks/useIsMounted";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const isMounted = useIsMounted();
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const initTheme = useThemeStore((s) => s.initTheme);

  useEffect(() => {
    const cleanup = initTheme();
    return cleanup;
  }, [initTheme]);

  if (!isMounted) {
    return (
      <div
        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-surface-border bg-surface-card opacity-50 shrink-0 ${className}`}
        aria-hidden="true"
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={isDark ? "Activar modo claro" : "Activar modo oscuro"}
      className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-surface-border bg-surface-card hover:bg-surface-card-hover text-text-muted hover:text-text-strong transition-all flex items-center justify-center shrink-0 shadow-2xs active:scale-95 cursor-pointer ${className}`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-brand-accent transition-transform duration-200 rotate-0" />
      ) : (
        <Moon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-neutral-700 transition-transform duration-200 rotate-0" />
      )}
    </button>
  );
}

