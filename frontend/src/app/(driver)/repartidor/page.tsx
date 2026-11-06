"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Suspense } from "react";
import { RefreshCw } from "lucide-react";
import { DriverDeliveryView } from "@/features/tracking";
import { AuthGuard, UserRole, useAuthStore } from "@/features/auth";
import { useTenantStore } from "@/features/tenant";
import { isPlatformHost } from "@/shared/lib/api-client";

export default function RepartidorRootPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const tenantSlug = useTenantStore((s) => s.tenantSlug) || user?.tenantSlug;

  useEffect(() => {
    // Solo redirigir canónicamente a /[slug]/repartidor si se navega desde el host global de la plataforma
    // En dominios personalizados de comercio (ej. pedidos.lagranjita.com), la URL limpia es /repartidor
    const isPlatform = typeof window !== "undefined" && isPlatformHost(window.location.hostname);
    if (tenantSlug && isPlatform) {
      router.replace(`/${tenantSlug}/repartidor`);
    }
  }, [tenantSlug, router]);

  return (
    <AuthGuard allowedRoles={[UserRole.SuperAdmin, UserRole.Driver]}>
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-text-inverse-muted">
            <RefreshCw className="h-8 w-8 animate-spin text-brand-primary mb-4" />
            <p className="text-xs">Cargando aplicación de repartidor...</p>
          </div>
        }
      >
        <DriverDeliveryView />
      </Suspense>
    </AuthGuard>
  );
}
