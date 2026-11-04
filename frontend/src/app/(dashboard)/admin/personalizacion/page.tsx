import { StorefrontCustomizerView } from "@/features/tenant/components/StorefrontCustomizerView";
import { AuthGuard, UserRole } from "@/features/auth";

export const instant = false;

export default function PersonalizacionStorefrontPage() {
  return (
    <AuthGuard allowedRoles={[UserRole.SuperAdmin, UserRole.TenantAdmin]}>
      <StorefrontCustomizerView />
    </AuthGuard>
  );
}

