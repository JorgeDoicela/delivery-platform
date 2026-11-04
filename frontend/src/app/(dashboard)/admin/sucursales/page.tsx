"use client";

import { Suspense } from "react";
import { RefreshCw } from "lucide-react";
import { BranchManagementView } from "@/features/branches";
import { AuthGuard, UserRole } from "@/features/auth";

export default function AdminSucursalesPage() {
  return (
    <AuthGuard
      allowedRoles={[
        UserRole.SuperAdmin,
        UserRole.TenantAdmin,
        UserRole.BranchManager,
      ]}
    >
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-text-inverse-muted">
            <RefreshCw className="h-8 w-8 animate-spin text-brand-primary mb-4" />
            <p className="text-sm font-medium">Cargando sucursales y geocercas...</p>
          </div>
        }
      >
        <BranchManagementView />
      </Suspense>
    </AuthGuard>
  );
}

