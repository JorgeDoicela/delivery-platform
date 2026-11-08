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
    staleTime: includeInactive ? 1000 * 15 : 1000 * 60,
    refetchOnWindowFocus: true,
    refetchInterval: includeInactive ? 30000 : false,
    retry: 2,
  });
}
