"use client";

import { AuthGuard } from "@/features/auth/components/AuthGuard";
import { AccountDashboardView } from "@/features/account";

export default function PlatformAccountPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-neutral-50/50">
        <AccountDashboardView />
      </div>
    </AuthGuard>
  );
}
