import { KitchenView } from '@/features/kitchen';
import { AuthGuard, UserRole } from '@/features/auth';

export const metadata = {
  title: 'Despacho de Mostrador | Operaciones',
  description: 'Pantalla operativa de comandas y despacho directo de mostrador en tiempo real.',
};

export const instant = false;

interface TenantMostradorPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function TenantMostradorPage({ params }: TenantMostradorPageProps) {
  await params;

  return (
    <AuthGuard
      allowedRoles={[
        UserRole.KitchenStaff,
        UserRole.Cashier,
        UserRole.BranchManager,
        UserRole.TenantAdmin,
        UserRole.SuperAdmin,
        'KitchenStaff',
        'Cashier',
        'BranchManager',
        'TenantAdmin',
        'SuperAdmin',
      ]}
    >
      <KitchenView />
    </AuthGuard>
  );
}
