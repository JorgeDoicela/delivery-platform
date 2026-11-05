import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/lib/api-client";
import type { ActiveMenuResponse } from "@/shared/types/api";
import { useTenantStore } from "@/features/tenant/store/useTenantStore";

export function useMenuQuery(includeInactive = false, slugOverride?: string | null) {
  const storeSlug = useTenantStore((s) => s.tenantSlug);
  const targetSlug = slugOverride !== undefined ? slugOverride : storeSlug;
  const tenantSlug = targetSlug?.trim().toLowerCase() || null;

  return useQuery<ActiveMenuResponse, Error>({
    queryKey: ["catalog", "menu", tenantSlug, includeInactive ? "all" : "active"],
    queryFn: () => apiClient.getActiveMenu(includeInactive, tenantSlug ?? undefined),
    enabled: Boolean(tenantSlug),
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });
}
