import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { WhatsAppMagicLinkView } from "@/features/auth";

interface TenantWhatsAppMagicLinkPageProps {
  params: Promise<{ slug: string }>;
}

async function TenantWhatsAppMagicLinkLoader({
  params,
}: TenantWhatsAppMagicLinkPageProps) {
  const { slug } = await params;
  return <WhatsAppMagicLinkView initialSlug={slug} />;
}

export default function TenantWhatsAppMagicLinkPage({
  params,
}: TenantWhatsAppMagicLinkPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[70dvh] text-text-muted gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Verificando acceso...
          </span>
        </div>
      }
    >
      <TenantWhatsAppMagicLinkLoader params={params} />
    </Suspense>
  );
}
