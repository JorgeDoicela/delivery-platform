import { KitchenView } from '@/features/kitchen';
import { AuthGuard, UserRole } from '@/features/auth';

export const metadata = {
  title: 'KDS Cocina | Operaciones',
  description: 'Pantalla operativa de comandas para cocina en tiempo real.',
};

export default function CocinaPage() {
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

