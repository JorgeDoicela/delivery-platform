import React, { Suspense } from "react";
import { StorefrontHeader } from "./components/StorefrontHeader";
import { StorefrontFooter } from "./components/StorefrontFooter";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { CartDrawer } from "@/features/cart";
import { FloatingWhatsAppButton } from "@/features/tenant";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-surface-canvas text-text-strong transition-colors duration-200">
      <Suspense fallback={null}>
        <StorefrontHeader />
      </Suspense>
      <main className="flex-1 w-full">{children}</main>
      <Suspense fallback={null}>
        <StorefrontFooter />
      </Suspense>
      <Suspense fallback={null}>
        <MobileBottomNav />
      </Suspense>
      <Suspense fallback={null}>
        <CartDrawer />
      </Suspense>
      <Suspense fallback={null}>
        <FloatingWhatsAppButton />
      </Suspense>
    </div>
  );
}
