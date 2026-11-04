import { create } from "zustand";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const THEME_STORAGE_KEY = "delivery_theme";

interface ThemeState {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  initTheme: () => () => void;
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyThemeClass(resolved: ResolvedTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (resolved === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "light",
  resolvedTheme: "light",

  setTheme: (theme: Theme) => {
    const resolved: ResolvedTheme = theme === "system" ? getSystemTheme() : theme;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
      } catch {
        // Ignora fallos de storage
      }
    }
    applyThemeClass(resolved);
    set({ theme, resolvedTheme: resolved });
  },

  toggleTheme: () => {
    const current = get().resolvedTheme;
    const next: ResolvedTheme = current === "dark" ? "light" : "dark";
    get().setTheme(next);
  },

  initTheme: () => {
    if (typeof window === "undefined") return () => {};

    let storedTheme: Theme = "system";
    try {
      const item = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      if (item === "light" || item === "dark" || item === "system") {
        storedTheme = item;
      }
    } catch {
      // Ignora fallos de storage
    }

    const resolved: ResolvedTheme =
      storedTheme === "system" ? getSystemTheme() : storedTheme;

    applyThemeClass(resolved);
    set({ theme: storedTheme, resolvedTheme: resolved });

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = (e: MediaQueryListEvent) => {
      if (get().theme === "system") {
        const nextResolved: ResolvedTheme = e.matches ? "dark" : "light";
        applyThemeClass(nextResolved);
        set({ resolvedTheme: nextResolved });
      }
    };

    mediaQuery.addEventListener("change", handleSystemChange);
    return () => mediaQuery.removeEventListener("change", handleSystemChange);
  },
}));

