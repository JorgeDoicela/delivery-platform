import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/lib/api-client";
import type { ActiveMenuResponse } from "@/shared/types/api";

export function useMenuQuery() {
  return useQuery<ActiveMenuResponse, Error>({
    queryKey: ["catalog", "menu"],
    queryFn: () => apiClient.getActiveMenu(),
    staleTime: 1000 * 60 * 5, // 5 minutos de validez de menú
    retry: 2,
  });
}
