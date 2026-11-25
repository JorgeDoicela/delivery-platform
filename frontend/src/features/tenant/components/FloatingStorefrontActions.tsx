"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useAuthStore, UserRole, isUserInRole } from "@/features/auth";
import { useIsMounted } from "@/shared/hooks/useIsMounted";
import { FloatingPwaInstallButton } from "./FloatingPwaInstallButton";
import { FloatingWhatsAppButton } from "./FloatingWhatsAppButton";

export function FloatingStorefrontActions() {
  const pathname = usePathname() || "";
  const isMounted = useIsMounted();
  const user = useAuthStore((s) => s.user);

  const isCheckoutRoute = /(?:^|\/)checkout(?:\/|$)/i.test(pathname);

  const isStaffOrAdmin =
    isMounted &&
    (isUserInRole(user, UserRole.SuperAdmin) ||
      isUserInRole(user, UserRole.TenantAdmin) ||
      isUserInRole(user, UserRole.BranchManager) ||
      isUserInRole(user, UserRole.KitchenStaff) ||
      isUserInRole(user, UserRole.Cashier) ||
      isUserInRole(user, UserRole.Driver));

  if (isStaffOrAdmin || isCheckoutRoute) {
    return null;
  }

  return (
    <aside
      aria-label="Acciones rápidas flotantes"
      className="fixed bottom-[56px] right-3 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end gap-2 sm:gap-2.5 select-none print:hidden pointer-events-none"
    >
      <FloatingPwaInstallButton />
      <div className="pointer-events-auto">
        <FloatingWhatsAppButton isEmbedded />
      </div>
    </aside>
  );
}
