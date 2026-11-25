"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Fingerprint, Loader2 } from "lucide-react";
import { usePasskeyAuth } from "../lib/usePasskeyAuth";
import { AlertBanner } from "@/shared/components";
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
        className="relative w-full max-w-[400px] mx-auto h-[40px] px-10 bg-surface-card hover:bg-surface-card-hover active:scale-95 border border-surface-border hover:border-surface-border/80 rounded-full text-sm font-medium font-sans text-text-strong shadow-xs transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-brand-primary shrink-0 absolute left-3.5" />
            <span className="text-sm font-medium text-text-muted">
              Verificando huella o rostro...
            </span>
          </>
        ) : (
          <>
            <Fingerprint className="w-[18px] h-[18px] text-brand-primary shrink-0 absolute left-3.5" />
            <span>Entrar con Huella o Rostro</span>
          </>
        )}
      </button>

      {displayError && (
        <AlertBanner variant="error">
          {displayError}
        </AlertBanner>
      )}
    </div>
  );
}
