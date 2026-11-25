import type { Metadata } from "next";
import React, { Suspense } from "react";
import LoginPage from "../../login/page";
import { RESERVED_TENANT_SLUGS } from "@/shared/lib/tenant-context";
import { notFound } from "next/navigation";
import { Loader2 } from "lucide-react";

interface TenantLoginPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const metadata: Metadata = {
  title: "Iniciar Sesión",
  description: "Acceso y registro de clientes y personal operativo.",
};

async function TenantLoginLoader({ params }: TenantLoginPageProps) {
  const { slug } = await params;

  if (RESERVED_TENANT_SLUGS.has(slug.toLowerCase())) {
    notFound();
  }

  return <LoginPage initialSlug={slug} />;
}

export default function TenantLoginPage({ params }: TenantLoginPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[100dvh] text-neutral-500 gap-2 mb-16 sm:mb-24">
          <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Cargando portal...
          </span>
        </div>
      }
    >
      <TenantLoginLoader params={params} />
    </Suspense>
  );
}

