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
        className={`w-8 h-8 sm:w-9 sm:h-9 opacity-0 shrink-0 ${className}`}
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
      className={`p-1.5 sm:p-2 rounded-full text-text-strong hover:text-brand-primary transition-colors flex items-center justify-center shrink-0 active:scale-95 cursor-pointer ${className}`}
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-brand-accent transition-transform duration-200 stroke-[1.8]" />
      ) : (
        <Moon className="w-5 h-5 text-text-strong hover:text-brand-primary transition-transform duration-200 stroke-[1.8]" />
      )}
    </button>
  );
}

