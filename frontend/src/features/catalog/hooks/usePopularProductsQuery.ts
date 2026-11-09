import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/lib/api-client";
import type { MenuProductDto } from "@/shared/types/api";
import { useTenantStore } from "@/features/tenant/store/useTenantStore";

export function usePopularProductsQuery(
  limit = 8,
  days = 30,
  slugOverride?: string | null
) {
  const storeSlug = useTenantStore((s) => s.tenantSlug);
  const targetSlug = slugOverride !== undefined ? slugOverride : storeSlug;
  const tenantSlug = targetSlug?.trim().toLowerCase() || null;

  return useQuery<MenuProductDto[], Error>({
    queryKey: ["catalog", "popular", tenantSlug, limit, days],
    queryFn: async () => {
      try {
        return await apiClient.getPopularProducts(limit, days, tenantSlug ?? undefined);
      } catch (err) {
        // Fallback resiliente: si el endpoint de ranking falla temporalmente,
        // extraemos los primeros platos activos del menú para no dejar la vista vacía.
        try {
          const menu = await apiClient.getActiveMenu(false, tenantSlug ?? undefined);
          const allProducts = (menu?.categories ?? []).flatMap((c) => c.products ?? []);
          return allProducts.slice(0, limit);
        } catch {
          throw err;
        }
      }
    },
    enabled: Boolean(tenantSlug),
    staleTime: 1000 * 60 * 5, // 5 minutos de frescura en cliente (coordinado con caché Redis)
    retry: 2,
  });
}
