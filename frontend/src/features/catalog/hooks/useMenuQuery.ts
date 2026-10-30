import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/lib/api-client";
import type { ActiveMenuResponse } from "@/shared/types/api";
import { useTenantStore } from "@/features/tenant/store/useTenantStore";

export function useMenuQuery() {
  const tenantSlug = useTenantStore((s) => s.tenantSlug);

  return useQuery<ActiveMenuResponse, Error>({
    queryKey: ["catalog", "menu", tenantSlug],
    queryFn: () => apiClient.getActiveMenu(),
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });
}
