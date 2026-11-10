import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import { RESERVED_TENANT_SLUGS } from "@/features/tenant/constants";
import { AuthGuard } from "@/features/auth/components/AuthGuard";
import { AccountDashboardView } from "@/features/account";
import { Loader2 } from "lucide-react";

interface TenantAccountPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: TenantAccountPageProps) {
  const { slug } = await params;
  if (RESERVED_TENANT_SLUGS.has(slug.toLowerCase())) {
    return {
      title: "No Encontrado | Mesafy",
    };
  }

  const formatted = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return {
    title: `Mi Cuenta • ${formatted}`,
    description: `Perfil de cliente, libreta de direcciones y seguimiento de pedidos para ${formatted}.`,
  };
}

async function TenantAccountLoader({ params }: TenantAccountPageProps) {
  const { slug } = await params;

  if (RESERVED_TENANT_SLUGS.has(slug.toLowerCase())) {
    notFound();
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-neutral-50/50">
        <AccountDashboardView tenantSlug={slug} />
      </div>
    </AuthGuard>
  );
}

export default function TenantAccountPage({ params }: TenantAccountPageProps) {
  return (
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
      <TenantAccountLoader params={params} />
    </Suspense>
  );
}

