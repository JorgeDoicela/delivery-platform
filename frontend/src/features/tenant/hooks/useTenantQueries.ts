"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/lib/api-client";
import type {
  BranchDetailDto,
  CreateTenantCommand,
  PlatformTenantsResponse,
  PublicTenantsResponse,
  TenantStorefrontConfigDto,
  UpdateTenantStorefrontCommand,
} from "@/shared/types/api";
import {
  FALLBACK_PUBLIC_TENANTS,
  getFallbackTenantConfig,
  useTenantStore,
} from "../store/useTenantStore";

export function useCurrentTenantQuery() {
  const tenantSlug = useTenantStore((s) => s.tenantSlug);

  return useQuery<TenantStorefrontConfigDto>({
    queryKey: ["tenant", "current", tenantSlug],
    queryFn: async () => {
      try {
        return await apiClient.getCurrentTenant(tenantSlug);
      } catch {
        return getFallbackTenantConfig(tenantSlug);
      }
    },
    placeholderData: () => getFallbackTenantConfig(tenantSlug),
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

export function useBranchesQuery() {
  const tenantSlug = useTenantStore((s) => s.tenantSlug);

  return useQuery<BranchDetailDto[]>({
    queryKey: ["branches", tenantSlug],
    queryFn: async () => {
      try {
        return await apiClient.getBranches();
      } catch {
        const fallback = getFallbackTenantConfig(tenantSlug);
        return fallback.branches.map((b) => ({
          ...b,
          sriEstablishmentCode: "001",
          sriEmissionPoint: "001",
        }));
      }
    },
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

