"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export interface UsePwaInstallReturn {
  isSupported: boolean;
  isInstalled: boolean;
  isIos: boolean;
  hasPrompt: boolean;
  triggerInstall: () => Promise<boolean>;
}

let hasAppInstalledEvent = false;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

export function resetPwaInstallState() {
  hasAppInstalledEvent = false;
  notifyListeners();
}

function subscribeToStandalone(callback: () => void): () => void {
  listeners.add(callback);
  if (typeof window === "undefined") {
    return () => {
      listeners.delete(callback);
    };
  }

  const mm = typeof window.matchMedia === "function" ? window.matchMedia : null;
  const standaloneQuery = mm ? mm("(display-mode: standalone)") : null;
  const fullscreenQuery = mm ? mm("(display-mode: fullscreen)") : null;
  const minimalUiQuery = mm ? mm("(display-mode: minimal-ui)") : null;

  const handleInstalled = () => {
    hasAppInstalledEvent = true;
    try {
      localStorage.setItem("mesafy_pwa_installed", "1");
    } catch {
      // Ignorar restricciones en navegacion privada
    }
    notifyListeners();
  };

  standaloneQuery?.addEventListener?.("change", callback);
  fullscreenQuery?.addEventListener?.("change", callback);
  minimalUiQuery?.addEventListener?.("change", callback);
  window.addEventListener("appinstalled", handleInstalled);

  return () => {
    listeners.delete(callback);
    standaloneQuery?.removeEventListener?.("change", callback);
    fullscreenQuery?.removeEventListener?.("change", callback);
    minimalUiQuery?.removeEventListener?.("change", callback);
    window.removeEventListener("appinstalled", handleInstalled);
  };
}

function getStandaloneSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  if (hasAppInstalledEvent) return true;

  // 1. Detección nativa por media query W3C (Chrome, Edge, Samsung Internet, Android, Windows)
  const isDisplayModeStandalone =
    typeof window.matchMedia === "function" &&
    (window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      window.matchMedia("(display-mode: minimal-ui)").matches);

  // 2. Detección nativa de iOS / iPadOS Safari (cuando se abre desde el icono en pantalla de inicio)
  const isIosStandalone =
    (window.navigator as unknown as { standalone?: boolean })?.standalone === true;

  // 3. Detección de Android Trusted Web Activity (TWA o WebAPK empaquetada)
  const isAndroidApp =
    typeof document !== "undefined" && document.referrer.startsWith("android-app://");

  // 4. Parámetro de origen o sesión PWA previa
  const isUrlPwa =
    typeof window.location?.search === "string" &&
    (window.location.search.includes("mode=pwa") || window.location.search.includes("source=pwa"));

  return Boolean(isDisplayModeStandalone || isIosStandalone || isAndroidApp || isUrlPwa);
}

function getServerSnapshot(): boolean {
  return false;
}

export function usePwaInstall(): UsePwaInstallReturn {
  const isInstalled = useSyncExternalStore(
    subscribeToStandalone,
    getStandaloneSnapshot,
    getServerSnapshot
  );

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const ua = window.navigator.userAgent?.toLowerCase() || "";
    return /iphone|ipad|ipod/.test(ua);
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const triggerInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        hasAppInstalledEvent = true;
        notifyListeners();
        setDeferredPrompt(null);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [deferredPrompt]);

  return {
    isSupported: typeof window !== "undefined",
    isInstalled,
    isIos,
    hasPrompt: deferredPrompt !== null,
    triggerInstall,
  };
}
