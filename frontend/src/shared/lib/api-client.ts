import type {
    ActiveMenuResponse,
    BranchCoverageDto,
    BranchCapacityResponse,
    BranchDetailDto,
    UpdateBranchHoursRequest,
    UpdateBranchHoursResponse,
    CreateOrderCommand,
    CreateOrderResponse,
    OrderDetailResponse,
    DriverLocationResponse,
    KitchenOrderTicketDto,
    PublicTenantsResponse,
    PlatformTenantsResponse,
    CreateTenantCommand,
    CreatedTenantDto,
    ToggleTenantStatusResponse,
    TenantStorefrontConfigDto,
    UpdateTenantStorefrontCommand,
    UpsertProductCommand,
    UpsertProductResponse,
    DriverProfileResponse,
    DriverOrdersResponse,
    DriverOrderDto,
    UpdateDriverStatusRequest,
    UpdateDriverStatusResponse,
    ApiError,
} from "@/shared/types/api";

export function getApiBaseUrl(): string {
    if (typeof window !== "undefined") {
        return process.env.NEXT_PUBLIC_API_URL || "";
    }
    return (
        process.env.INTERNAL_API_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:5005"
    );
}

import {
    ACTIVE_TENANT_STORAGE_KEY,
    DEFAULT_TENANT_SLUG,
    RESERVED_TENANT_SLUGS,
    getApiClientAccessToken,
    getApiClientTenantSlug,
    setApiClientAccessToken,
    setApiClientTenantSlug,
} from "./tenant-context";

export {
    ACTIVE_TENANT_STORAGE_KEY,
    DEFAULT_TENANT_SLUG,
    RESERVED_TENANT_SLUGS,
    getApiClientTenantSlug,
    setApiClientAccessToken,
    setApiClientTenantSlug,
};

function buildHeaders(
    extraHeaders?: Record<string, string>,
    tenantSlugOverride?: string
): Record<string, string> {
    const slug = tenantSlugOverride || getApiClientTenantSlug();
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(slug ? { "X-Tenant-Slug": slug } : {}),
        ...extraHeaders,
    };

    const token = getApiClientAccessToken();
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
}

export class ApiClientError extends Error {
    code: string;
    status: number;

    constructor(message: string, code: string, status: number) {
        super(message);
        this.name = "ApiClientError";
        this.code = code;
        this.status = status;
    }
}

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const errorData: ApiError = {
            code: `HTTP_${response.status}`,
            message: "Ha ocurrido un error inesperado en el servidor.",
        };

        try {
            const json = await response.json();
            if (json.detail) {
                errorData.message = json.detail;
            } else if (json.message) {
                errorData.message = json.message;
            } else if (json.error) {
                errorData.message = json.error;
            } else if (json.title) {
                errorData.message = json.title;
            }

            if (json.code) {
                errorData.code = json.code;
            } else if (json.status) {
                errorData.code = `HTTP_${json.status}`;
            }
        } catch {
            // Usar mensaje predeterminado si no es un payload JSON válido
        }

        throw new ApiClientError(errorData.message, errorData.code, response.status);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return response.json();
}

export const apiClient = {
    // 0. Multi-Tenant: Directorio público de negocios y configuración de Storefront
    async getPublicTenants(): Promise<PublicTenantsResponse> {
        const res = await fetch(`${getApiBaseUrl()}/api/tenants`, {
            method: "GET",
            headers: buildHeaders(),
            cache: "no-store",
        });
        return handleResponse<PublicTenantsResponse>(res);
    },

    async getPlatformTenants(): Promise<PlatformTenantsResponse> {
        const res = await fetch(`${getApiBaseUrl()}/api/tenants/platform`, {
            method: "GET",
            headers: buildHeaders(),
            cache: "no-store",
        });
        return handleResponse<PlatformTenantsResponse>(res);
    },

    async createTenant(command: CreateTenantCommand): Promise<CreatedTenantDto> {
        const res = await fetch(`${getApiBaseUrl()}/api/tenants`, {
            method: "POST",
            headers: buildHeaders(),
            body: JSON.stringify(command),
        });
        return handleResponse<CreatedTenantDto>(res);
    },

    async toggleTenantStatus(
        tenantId: string,
        isActive: boolean
    ): Promise<ToggleTenantStatusResponse> {
        const res = await fetch(`${getApiBaseUrl()}/api/tenants/${tenantId}/status`, {
            method: "PATCH",
            headers: buildHeaders(),
            body: JSON.stringify({ isActive }),
        });
        return handleResponse<ToggleTenantStatusResponse>(res);
    },

    async getCurrentTenant(tenantSlugOverride?: string): Promise<TenantStorefrontConfigDto> {
        const res = await fetch(`${getApiBaseUrl()}/api/tenants/current`, {
            method: "GET",
            headers: buildHeaders(undefined, tenantSlugOverride),
            cache: "no-store",
        });
        return handleResponse<TenantStorefrontConfigDto>(res);
    },

    async updateTenantStorefront(
        command: UpdateTenantStorefrontCommand
    ): Promise<TenantStorefrontConfigDto> {
        const res = await fetch(`${getApiBaseUrl()}/api/tenants/current/storefront`, {
            method: "PUT",
            headers: buildHeaders(),
            body: JSON.stringify(command),
        });
        return handleResponse<TenantStorefrontConfigDto>(res);
    },

    async getBranches(): Promise<BranchDetailDto[]> {
        const res = await fetch(`${getApiBaseUrl()}/api/branches`, {
            method: "GET",
            headers: buildHeaders(),
            cache: "no-store",
        });
        return handleResponse<BranchDetailDto[]>(res);
    },

    async updateBranchOperatingHours(
        branchId: number,
        data: UpdateBranchHoursRequest
    ): Promise<UpdateBranchHoursResponse> {
        const res = await fetch(`${getApiBaseUrl()}/api/branches/${branchId}/schedule`, {
            method: "PUT",
            headers: buildHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse<UpdateBranchHoursResponse>(res);
    },

    // 1. Geofencing: Resolución espacial de cobertura
    async resolveBranch(latitude: number, longitude: number): Promise<BranchCoverageDto> {
        const res = await fetch(`${getApiBaseUrl()}/api/geofencing/resolve`, {
            method: "POST",
            headers: buildHeaders(),
            body: JSON.stringify({ latitude, longitude }),
        });
        return handleResponse<BranchCoverageDto>(res);
    },

    // 1.1 Capacidad y Throttling por franja de 20 min en Redis
    async getBranchCapacity(branchId: number): Promise<BranchCapacityResponse> {
        const res = await fetch(`${getApiBaseUrl()}/api/branches/${branchId}/capacity`, {
            method: "GET",
            headers: buildHeaders(),
            cache: "no-store",
        });
        return handleResponse<BranchCapacityResponse>(res);
    },

    // 2. Catálogo: Menú activo y combos
    async getActiveMenu(
        includeInactive = false,
        tenantSlugOverride?: string
    ): Promise<ActiveMenuResponse> {
        const query = includeInactive ? "?includeInactive=true" : "";
        const res = await fetch(`${getApiBaseUrl()}/api/catalog/menu${query}`, {
            method: "GET",
            headers: buildHeaders(undefined, tenantSlugOverride),
            cache: "no-store",
        });
        return handleResponse<ActiveMenuResponse>(res);
    },

    // 3. Órdenes: Creación transaccional con idempotencia
    async createOrder(
        command: CreateOrderCommand,
        idempotencyKey?: string
    ): Promise<CreateOrderResponse> {
        const extra: Record<string, string> = {};
        if (idempotencyKey) {
            extra["Idempotency-Key"] = idempotencyKey;
        }

        const res = await fetch(`${getApiBaseUrl()}/api/orders`, {
            method: "POST",
            headers: buildHeaders(extra),
            body: JSON.stringify(command),
        });
        return handleResponse<CreateOrderResponse>(res);
    },

    // 4. Órdenes: Detalle y tracking
    async getOrderById(orderId: string): Promise<OrderDetailResponse> {
        const res = await fetch(`${getApiBaseUrl()}/api/orders/${orderId}`, {
            method: "GET",
            headers: buildHeaders(),
            cache: "no-store",
        });
        return handleResponse<OrderDetailResponse>(res);
    },

    // 5. Tracking: Posición del repartidor desde Redis
    async getDriverLocation(orderId: string): Promise<DriverLocationResponse> {
        const res = await fetch(
            `${getApiBaseUrl()}/api/tracking/orders/${orderId}/driver-location`,
            {
                method: "GET",
                headers: buildHeaders(),
                cache: "no-store",
            }
        );
        return handleResponse<DriverLocationResponse>(res);
    },

    // 6. Cocina: Comandas activas FIFO para KDS
    async getActiveKitchenOrders(branchId: number): Promise<KitchenOrderTicketDto[]> {
        const res = await fetch(`${getApiBaseUrl()}/api/kitchen/branches/${branchId}/orders`, {
            method: "GET",
            headers: buildHeaders(),
            cache: "no-store",
        });
        return handleResponse<KitchenOrderTicketDto[]>(res);
    },

    // 7. Órdenes: Actualización de estado en máquina de estados
    async updateOrderStatus(orderId: string, status: number, reason?: string): Promise<void> {
        const res = await fetch(`${getApiBaseUrl()}/api/orders/${orderId}/status`, {
            method: "PUT",
            headers: buildHeaders(),
            body: JSON.stringify({ orderId, newStatus: status, reason }),
        });
        return handleResponse<void>(res);
    },

    // 8. Repartidor: Ingesta de geoposición satelital
    async ingestDriverLocation(
        driverId: string,
        orderId: string,
        latitude: number,
        longitude: number,
        heading?: number
    ): Promise<void> {
        const res = await fetch(`${getApiBaseUrl()}/api/tracking/driver-location`, {
            method: "POST",
            headers: buildHeaders(),
            body: JSON.stringify({ driverId, orderId, latitude, longitude, heading }),
        });
        return handleResponse<void>(res);
    },

    // 9. Catálogo: Conmutar disponibilidad de producto (Stock en tiempo real)
    async toggleProductStatus(
        productId: number,
        isActive: boolean
    ): Promise<{ productId: number; isActive: boolean; productName: string }> {
        const res = await fetch(`${getApiBaseUrl()}/api/catalog/products/${productId}/status`, {
            method: "PUT",
            headers: buildHeaders(),
            body: JSON.stringify({ productId, isActive }),
        });
        return handleResponse<{ productId: number; isActive: boolean; productName: string }>(res);
    },

    // 10. Catálogo: Crear nuevo producto con su imagen personalizada
    async createProduct(command: UpsertProductCommand): Promise<UpsertProductResponse> {
        const res = await fetch(`${getApiBaseUrl()}/api/catalog/products`, {
            method: "POST",
            headers: buildHeaders(),
            body: JSON.stringify(command),
        });
        return handleResponse<UpsertProductResponse>(res);
    },

    // 11. Catálogo: Editar producto existente (nombre, descripción, precio, categoría e imagen)
    async updateProduct(
        productId: number,
        command: UpsertProductCommand
    ): Promise<UpsertProductResponse> {
        const res = await fetch(`${getApiBaseUrl()}/api/catalog/products/${productId}`, {
            method: "PUT",
            headers: buildHeaders(),
            body: JSON.stringify({ ...command, productId }),
        });
        return handleResponse<UpsertProductResponse>(res);
    },

    // 12. Repartidor: Perfil operativo y estado
    async getDriverProfile(): Promise<DriverProfileResponse> {
        const res = await fetch(`${getApiBaseUrl()}/api/driver/me`, {
            method: "GET",
            headers: buildHeaders(),
            cache: "no-store",
        });
        return handleResponse<DriverProfileResponse>(res);
    },

    // 13. Repartidor: Actualizar disponibilidad y vehículo
    async updateDriverStatus(
        data: UpdateDriverStatusRequest
    ): Promise<UpdateDriverStatusResponse> {
        const res = await fetch(`${getApiBaseUrl()}/api/driver/status`, {
            method: "PUT",
            headers: buildHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse<UpdateDriverStatusResponse>(res);
    },

    // 14. Repartidor: Bandejas de pedidos (Activos, Disponibles, Entregados hoy)
    async getDriverOrders(branchId?: number): Promise<DriverOrdersResponse> {
        const query = branchId ? `?branchId=${branchId}` : "";
        const res = await fetch(`${getApiBaseUrl()}/api/driver/orders${query}`, {
            method: "GET",
            headers: buildHeaders(),
            cache: "no-store",
        });
        return handleResponse<DriverOrdersResponse>(res);
    },

    // 15. Repartidor: Reclamar / Asignarse comanda lista en cocina
    async claimDriverOrder(orderId: string): Promise<DriverOrderDto> {
        const res = await fetch(`${getApiBaseUrl()}/api/driver/orders/${orderId}/claim`, {
            method: "POST",
            headers: buildHeaders(),
        });
        return handleResponse<DriverOrderDto>(res);
    },
};
