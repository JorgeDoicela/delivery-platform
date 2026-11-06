"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { KitchenView } from '@/features/kitchen';
import { AuthGuard, UserRole, useAuthStore } from '@/features/auth';
import { useTenantStore } from '@/features/tenant';
import { isPlatformHost } from '@/shared/lib/api-client';

export default function CocinaRootPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const tenantSlug = useTenantStore((s) => s.tenantSlug) || user?.tenantSlug;

  useEffect(() => {
    // Solo redirigir a /[slug]/cocina en dominios de la plataforma principal
    // En dominios propios de comercio (ej. pedidos.lagranjita.com), la URL limpia es /cocina
    const isPlatform = typeof window !== "undefined" && isPlatformHost(window.location.hostname);
    if (tenantSlug && isPlatform) {
      router.replace(`/${tenantSlug}/cocina`);
    }
  }, [tenantSlug, router]);

  return (
    <AuthGuard
      allowedRoles={[
        UserRole.KitchenStaff,
        UserRole.BranchManager,
        UserRole.TenantAdmin,
        UserRole.SuperAdmin,
        'KitchenStaff',
        'BranchManager',
        'TenantAdmin',
        'SuperAdmin',
      ]}
    >
      <KitchenView />
    </AuthGuard>
  );
}
