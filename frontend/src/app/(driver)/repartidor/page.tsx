"use client";

import { Suspense } from 'react';
import { RefreshCw } from 'lucide-react';
import { DriverDeliveryView } from '@/features/tracking';
import { AuthGuard, UserRole } from '@/features/auth';

export default function RepartidorPage() {
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

