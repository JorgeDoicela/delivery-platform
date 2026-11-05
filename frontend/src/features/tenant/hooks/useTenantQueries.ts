"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/lib/api-client";
import type {
  BranchDetailDto,
  CreateTenantCommand,
  PlatformTenantsResponse,
  PublicTenantsResponse,
  TenantStorefrontConfigDto,
  UpdateBranchHoursRequest,
  UpdateTenantStorefrontCommand,
} from "@/shared/types/api";
import {
  FALLBACK_PUBLIC_TENANTS,
  getFallbackTenantConfig,
  useTenantStore,
} from "../store/useTenantStore";

export function useCurrentTenantQuery(slugOverride?: string | null) {
  const storeSlug = useTenantStore((s) => s.tenantSlug);
  const targetSlug = slugOverride !== undefined ? slugOverride : storeSlug;
  const normalizedSlug = targetSlug?.trim().toLowerCase() || null;

  return useQuery<TenantStorefrontConfigDto | null>({
    queryKey: ["tenant", "current", normalizedSlug],
    queryFn: async () => {
      if (!normalizedSlug) return null;
      try {
        return await apiClient.getCurrentTenant(normalizedSlug);
      } catch {
        return getFallbackTenantConfig(normalizedSlug);
      }
    },
    enabled: Boolean(normalizedSlug),
    placeholderData: normalizedSlug ? () => getFallbackTenantConfig(normalizedSlug) : undefined,
    staleTime: 1000 * 60 * 2,
  });
}

export function usePublicTenantsQuery() {
  return useQuery<PublicTenantsResponse>({
    queryKey: ["tenant", "public-list"],
    queryFn: async () => {
      try {
        return await apiClient.getPublicTenants();
      } catch {
        return { tenants: FALLBACK_PUBLIC_TENANTS };
      }
    },
    placeholderData: { tenants: FALLBACK_PUBLIC_TENANTS },
    staleTime: 1000 * 60 * 5,
  });
}

export function useBranchesQuery(slugOverride?: string | null) {
  const storeSlug = useTenantStore((s) => s.tenantSlug);
  const targetSlug = slugOverride !== undefined ? slugOverride : storeSlug;
  const normalizedSlug = targetSlug?.trim().toLowerCase() || null;

  return useQuery<BranchDetailDto[]>({
    queryKey: ["branches", normalizedSlug],
    queryFn: async () => {
      if (!normalizedSlug) return [];
      try {
        return await apiClient.getBranches();
      } catch {
        const fallback = getFallbackTenantConfig(normalizedSlug);
        return fallback.branches.map((b) => ({
          ...b,
          sriEstablishmentCode: "001",
          sriEmissionPoint: "001",
        }));
      }
    },
    enabled: Boolean(normalizedSlug),
    staleTime: 1000 * 60 * 2,
  });
}

export function useUpdateTenantStorefrontMutation() {
  const queryClient = useQueryClient();
  const tenantSlug = useTenantStore((s) => s.tenantSlug);

  return useMutation({
    mutationFn: (command: UpdateTenantStorefrontCommand) =>
      apiClient.updateTenantStorefront(command),
    onSuccess: (updatedConfig) => {
      queryClient.setQueryData(["tenant", "current", tenantSlug], updatedConfig);
      queryClient.invalidateQueries({ queryKey: ["tenant", "public-list"] });
      queryClient.invalidateQueries({ queryKey: ["tenant", "platform-list"] });
      queryClient.invalidateQueries({ queryKey: ["branches", tenantSlug] });
    },
  });
}

export function usePlatformTenantsQuery() {
  return useQuery<PlatformTenantsResponse>({
    queryKey: ["tenant", "platform-list"],
    queryFn: () => apiClient.getPlatformTenants(),
    staleTime: 1000 * 30,
  });
}

export function useCreateTenantMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (command: CreateTenantCommand) => apiClient.createTenant(command),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant", "platform-list"] });
      queryClient.invalidateQueries({ queryKey: ["tenant", "public-list"] });
    },
  });
}

export function useToggleTenantStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tenantId, isActive }: { tenantId: string; isActive: boolean }) =>
      apiClient.toggleTenantStatus(tenantId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant", "platform-list"] });
      queryClient.invalidateQueries({ queryKey: ["tenant", "public-list"] });
    },
  });
}

export function useUpdateBranchHoursMutation() {
  const queryClient = useQueryClient();
  const tenantSlug = useTenantStore((s) => s.tenantSlug);

  return useMutation({
    mutationFn: ({
      branchId,
      data,
    }: {
      branchId: number;
      data: UpdateBranchHoursRequest;
    }) => apiClient.updateBranchOperatingHours(branchId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      queryClient.invalidateQueries({ queryKey: ["tenant", "current", tenantSlug] });
      queryClient.invalidateQueries({ queryKey: ["branch-capacities"] });
    },
  });
}


