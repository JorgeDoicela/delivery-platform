"use client";

import { Suspense } from "react";
import { AuthGuard } from "@/features/auth/components/AuthGuard";
import { AccountDashboardView } from "@/features/account";
import { Loader2 } from "lucide-react";

export default function PlatformAccountPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-surface-canvas">
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-neutral-500 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-neutral-900" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Cargando cuenta...
              </span>
            </div>
          }
        >
          <AccountDashboardView />
        </Suspense>
      </div>
    </AuthGuard>
  );
}

