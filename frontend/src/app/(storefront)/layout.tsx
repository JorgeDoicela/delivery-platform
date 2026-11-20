import React, { Suspense } from "react";
import { headers } from "next/headers";
import { StorefrontHeader } from "./components/StorefrontHeader";
import { StorefrontFooter } from "./components/StorefrontFooter";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { CartDrawer } from "@/features/cart";
import { FloatingStorefrontActions } from "@/features/tenant";
import { TenantHostProvider } from "@/shared/lib/tenant-host-context";

async function ServerTenantHostWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const host =
    headersList.get("x-tenant-host") ||
    headersList.get("x-forwarded-host") ||
    headersList.get("host")?.split(":")[0] ||
    "localhost";

  return <TenantHostProvider host={host}>{children}</TenantHostProvider>;
}

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-surface-canvas text-text-strong transition-colors duration-200">
      <Suspense fallback={null}>
        <ServerTenantHostWrapper>
          <StorefrontHeader />
        </ServerTenantHostWrapper>
      </Suspense>
      <main className="flex-1 w-full">{children}</main>
      <Suspense fallback={null}>
        <ServerTenantHostWrapper>
          <StorefrontFooter />
        </ServerTenantHostWrapper>
      </Suspense>
      <Suspense fallback={null}>
        <ServerTenantHostWrapper>
          <MobileBottomNav />
        </ServerTenantHostWrapper>
      </Suspense>
      <Suspense fallback={null}>
        <CartDrawer />
      </Suspense>
      <Suspense fallback={null}>
        <FloatingStorefrontActions />
      </Suspense>
    </div>
  );
}
