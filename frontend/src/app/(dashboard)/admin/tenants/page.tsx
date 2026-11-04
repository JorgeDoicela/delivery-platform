import { PlatformTenantsGovernanceView } from "@/features/tenant";
import { AuthGuard, UserRole } from "@/features/auth";

export const instant = false;

export default function AdminTenantsPage() {
  return (
    <AuthGuard allowedRoles={[UserRole.SuperAdmin, "SuperAdmin"]}>
      <PlatformTenantsGovernanceView />
    </AuthGuard>
  );
}

