import type { Metadata } from "next";
import React from "react";
import { DynamicPwaManifest } from "@/features/tenant";

export const metadata: Metadata = {
  manifest: "/manifest.json",
};

export default function TenantStorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <React.Suspense fallback={null}>
        <DynamicPwaManifest />
      </React.Suspense>
      {children}
    </>
  );
}
