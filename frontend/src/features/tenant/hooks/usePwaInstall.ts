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

  const mediaQuery =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(display-mode: standalone)")
      : null;

  const handleInstalled = () => {
    hasAppInstalledEvent = true;
    notifyListeners();
  };

  if (mediaQuery?.addEventListener) {
    mediaQuery.addEventListener("change", callback);
  }
  window.addEventListener("appinstalled", handleInstalled);

  return () => {
    listeners.delete(callback);
    if (mediaQuery?.removeEventListener) {
      mediaQuery.removeEventListener("change", callback);
    }
    window.removeEventListener("appinstalled", handleInstalled);
  };
}

function getStandaloneSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  if (hasAppInstalledEvent) return true;
  return Boolean(
    (typeof window.matchMedia === "function" &&
      window.matchMedia("(display-mode: standalone)").matches) ||
      (window.navigator as unknown as { standalone?: boolean })?.standalone === true
  );
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
