"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Fingerprint, Loader2, AlertCircle } from "lucide-react";
import { usePasskeyAuth } from "../lib/usePasskeyAuth";
import { useAuthStore } from "../store/useAuthStore";
import { useCurrentTenantQuery, useTenantStore } from "@/features/tenant";
import { resolveTenantRouting, useTenantRoutes } from "@/shared/lib/tenant-routing";
import { resolvePostLoginRedirect } from "../lib/redirectByRole";

interface PasskeySignInButtonProps {
  redirectUrl?: string;
  emailHint?: string;
}

export function PasskeySignInButton({
  redirectUrl,
  emailHint,
}: PasskeySignInButtonProps) {
  const router = useRouter();
  const { data: tenant } = useCurrentTenantQuery();
  const routes = useTenantRoutes(tenant?.slug);
  const { isSupported, isLoading, error, loginWithPasskey, clearError } = usePasskeyAuth();
  const [localError, setLocalError] = useState<string | null>(null);

  if (!isSupported) {
    return null;
  }

  const handlePasskeyLogin = async () => {
    setLocalError(null);
    clearError();

    const tenantSlug = routes.isPlatformRoot
      ? undefined
      : (tenant?.slug || useTenantStore.getState().tenantSlug || undefined);
    const success = await loginWithPasskey(emailHint || undefined, tenantSlug);

    if (success) {
      const loggedUser = useAuthStore.getState().user;
      if (loggedUser?.tenantSlug) {
        useTenantStore.getState().setTenantSlug(loggedUser.tenantSlug);
      }

      const activeSlug =
        loggedUser?.tenantSlug || tenantSlug || undefined;

      const routing = resolveTenantRouting({
        explicitSlug: activeSlug,
        pathname: typeof window !== "undefined" ? window.location.pathname : "/",
        hostname: typeof window !== "undefined" ? window.location.hostname : undefined,
      });

      const destination = resolvePostLoginRedirect({
        user: loggedUser,
        redirectUrl,
        routing,
      });

      if (
        typeof window !== "undefined" &&
        window.location.pathname === destination
      ) {
        window.location.reload();
      } else {
        router.push(destination);
      }
    }
  };

  const displayError = localError || error;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handlePasskeyLogin}
        disabled={isLoading}
        aria-label="Entrar con huella o reconocimiento facial"
        className="w-full min-h-[48px] bg-surface-card hover:bg-surface-card-hover active:scale-[0.99] text-text-strong font-bold text-xs uppercase tracking-wider font-display rounded-xl border border-surface-border hover:border-brand-primary/50 shadow-2xs transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer px-4"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
            <span className="font-sans normal-case text-xs text-text-muted">
              Verifica tu huella o rostro en tu equipo...
            </span>
          </>
        ) : (
          <>
            <Fingerprint className="w-4 h-4 text-brand-primary shrink-0" />
            <span className="font-sans normal-case text-xs font-semibold">
              Entrar con Huella o Rostro
            </span>
          </>
        )}
      </button>

      {displayError && (
        <div
          role="alert"
          className="flex items-center gap-2 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-600 dark:text-red-400" />
          <span className="font-medium text-[11px] leading-tight">{displayError}</span>
        </div>
      )}
    </div>
  );
}
