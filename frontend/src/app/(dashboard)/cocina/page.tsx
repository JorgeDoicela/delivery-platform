"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { KitchenView } from '@/features/kitchen';
import { AuthGuard, UserRole, useAuthStore } from '@/features/auth';
import { useTenantStore } from '@/features/tenant';

export default function CocinaRootPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const tenantSlug = useTenantStore((s) => s.tenantSlug) || user?.tenantSlug;

  useEffect(() => {
    if (tenantSlug) {
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
