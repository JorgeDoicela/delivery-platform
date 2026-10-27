import type {
  ActiveMenuResponse,
  BranchCoverageDto,
  BranchCapacityResponse,
  CreateOrderCommand,
  CreateOrderResponse,
  OrderDetailResponse,
  DriverLocationResponse,
  KitchenOrderTicketDto,
  ApiError,
} from "@/shared/types/api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5005";

class ApiClientError extends Error {
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
    let errorData: ApiError = {
      code: `HTTP_${response.status}`,
      message: "Ha ocurrido un error inesperado en el servidor.",
    };

    try {
      const json = await response.json();
      if (json.code && json.message) {
        errorData = json;
      } else if (json.error) {
        errorData.message = json.error;
      }
    } catch {
      // Usar mensaje predeterminado si no es JSON
    }

    throw new ApiClientError(errorData.message, errorData.code, response.status);
  }

  return response.json();
}

export const apiClient = {
  // 1. Geofencing: Resolución espacial de cobertura
  async resolveBranch(latitude: number, longitude: number): Promise<BranchCoverageDto> {
    const res = await fetch(`${API_BASE_URL}/api/geofencing/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ latitude, longitude }),
    });
    return handleResponse<BranchCoverageDto>(res);
  },

  // 1.1 Capacidad y Throttling por franja de 20 min en Redis
  async getBranchCapacity(branchId: number): Promise<BranchCapacityResponse> {
    const res = await fetch(`${API_BASE_URL}/api/branches/${branchId}/capacity`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    return handleResponse<BranchCapacityResponse>(res);
  },

  // 2. Catálogo: Menú activo y combos
  async getActiveMenu(): Promise<ActiveMenuResponse> {
    const res = await fetch(`${API_BASE_URL}/api/catalog/menu`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    return handleResponse<ActiveMenuResponse>(res);
  },

  // 3. Órdenes: Creación transaccional con idempotencia
  async createOrder(
    command: CreateOrderCommand,
    idempotencyKey?: string
  ): Promise<CreateOrderResponse> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (idempotencyKey) {
      headers["Idempotency-Key"] = idempotencyKey;
    }

    const res = await fetch(`${API_BASE_URL}/api/orders`, {
      method: "POST",
      headers,
      body: JSON.stringify(command),
    });
    return handleResponse<CreateOrderResponse>(res);
  },

  // 4. Órdenes: Detalle y tracking
  async getOrderById(orderId: string): Promise<OrderDetailResponse> {
    const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    return handleResponse<OrderDetailResponse>(res);
  },

  // 5. Tracking: Posición del repartidor desde Redis
  async getDriverLocation(orderId: string): Promise<DriverLocationResponse> {
    const res = await fetch(
      `${API_BASE_URL}/api/tracking/orders/${orderId}/driver-location`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      }
    );
    return handleResponse<DriverLocationResponse>(res);
  },

  // 6. Cocina: Comandas activas FIFO para KDS
  async getActiveKitchenOrders(branchId: number): Promise<KitchenOrderTicketDto[]> {
    const res = await fetch(`${API_BASE_URL}/api/kitchen/branches/${branchId}/orders`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    return handleResponse<KitchenOrderTicketDto[]>(res);
  },

  // 7. Órdenes: Actualización de estado en máquina de estados
  async updateOrderStatus(orderId: string, status: number, reason?: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
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
    const res = await fetch(`${API_BASE_URL}/api/tracking/driver-location`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ driverId, orderId, latitude, longitude, heading }),
    });
    return handleResponse<void>(res);
  },
};
