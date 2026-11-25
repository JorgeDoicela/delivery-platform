"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { WhatsAppIcon } from "@/shared/components/WhatsAppIcon";
import { useAuthStore } from "../store/useAuthStore";
import { resolvePostLoginRedirect } from "../lib/redirectByRole";
import { useCurrentTenantQuery, useTenantStore } from "@/features/tenant";
import { resolveTenantRouting, useTenantRoutes } from "@/shared/lib/tenant-routing";

interface WhatsAppMagicLinkViewProps {
  initialSlug?: string;
}

function buildSafeNextDestination(
  rawNext: string | null | undefined,
  basePath: string
): string | undefined {
  if (!rawNext || !rawNext.startsWith("/") || rawNext.startsWith("//")) {
    return undefined;
  }
  if (basePath && !rawNext.startsWith(basePath)) {
    return `${basePath}${rawNext}`;
  }
  return rawNext;
}

export function WhatsAppMagicLinkView({ initialSlug }: WhatsAppMagicLinkViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("t") || searchParams.get("token") || "";
  const nextParam = searchParams.get("next") || searchParams.get("redirect");

  const { data: tenant } = useCurrentTenantQuery(initialSlug);
  const routes = useTenantRoutes(initialSlug || tenant?.slug);
  const exchangeWhatsAppMagicLink = useAuthStore((s) => s.exchangeWhatsAppMagicLink);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasAttemptedRef = useRef(false);
  const cleanToken = token.trim();
  const displayedError = !cleanToken
    ? "El enlace de acceso no contiene un token válido."
    : errorMessage;

  useEffect(() => {
    if (!cleanToken || hasAttemptedRef.current) return;
    hasAttemptedRef.current = true;

    let cancelled = false;

    const exchange = async () => {
      const response = await exchangeWhatsAppMagicLink({
        token: cleanToken,
        tenantSlug: initialSlug || tenant?.slug || undefined,
      });

      if (cancelled) return;

      if (!response) {
        const authErr = useAuthStore.getState().error;
        setErrorMessage(
          authErr || "El enlace de acceso de WhatsApp es inválido, expiró o ya fue utilizado."
        );
        return;
      }

      const loggedUser = useAuthStore.getState().user;
      if (loggedUser?.tenantSlug) {
        useTenantStore.getState().setTenantSlug(loggedUser.tenantSlug);
      }

      const resolvedSlug =
        loggedUser?.tenantSlug || initialSlug || tenant?.slug || undefined;

      const routing = resolveTenantRouting({
        explicitSlug: resolvedSlug,
        pathname: typeof window !== "undefined" ? window.location.pathname : "/",
        hostname: typeof window !== "undefined" ? window.location.hostname : undefined,
      });

      const safeRedirect = buildSafeNextDestination(
        nextParam || response.redirectPath,
        routing.basePath
      );

      const destination = resolvePostLoginRedirect({
        user: loggedUser,
        redirectUrl: safeRedirect,
        routing,
        useKitchenWorkflow: tenant?.enableKitchenWorkflow,
      });

      router.replace(destination);
      router.refresh();
    };

    void exchange();

    return () => {
      cancelled = true;
    };
  }, [
    cleanToken,
    nextParam,
    initialSlug,
    tenant?.slug,
    tenant?.enableKitchenWorkflow,
    exchangeWhatsAppMagicLink,
    router,
  ]);

  return (
    <div className="w-full max-w-md mx-auto px-4 py-16 sm:py-24 min-h-[70dvh] flex items-center justify-center">
      <div className="w-full bg-surface-card border border-surface-border rounded-3xl p-7 sm:p-9 shadow-sm text-center space-y-5">
        <div className="flex justify-center">
          <WhatsAppIcon className="w-10 h-10 text-[#25D366] fill-current" />
        </div>

        {displayedError ? (
          <>
            <div className="space-y-2">
              <h1 className="font-display font-black text-2xl uppercase tracking-tight text-text-strong">
                Enlace expirado o inválido
              </h1>
              <div className="border border-surface-border bg-surface-canvas rounded-2xl p-3.5 text-xs text-text-base flex items-start gap-2.5 text-left">
                <AlertCircle className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
                <span className="leading-relaxed">{displayedError}</span>
              </div>
            </div>

            <Link
              href={routes.getLoginHref()}
              className="w-full min-h-[46px] px-5 py-2.5 bg-brand-primary hover:bg-brand-primary-hover active:scale-95 text-white font-bold text-sm uppercase tracking-wider font-display rounded-full shadow-sm transition-all inline-flex items-center justify-center"
            >
              Volver a iniciar sesión
            </Link>
          </>
        ) : (
          <div className="space-y-3">
            <Loader2 className="w-7 h-7 animate-spin text-brand-primary mx-auto" />
            <h1 className="font-display font-black text-2xl uppercase tracking-tight text-text-strong">
              Iniciando sesión con WhatsApp
            </h1>
            <p className="text-xs text-text-muted leading-relaxed">
              Validando tu enlace seguro para acceder a tu cuenta...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
