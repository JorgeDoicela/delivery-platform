import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  apiClient,
  ApiClientError,
  getApiClientTenantSlug,
  setApiClientTenantSlug,
  isPlatformHost,
  getTenantSubdomain,
  getApiClientTenantDomain,
} from './api-client';

describe('apiClient - RFC 7807 Error Handling', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('correctly parses RFC 7807 ProblemDetails with detail and code', async () => {
    const mockProblemDetails = {
      type: 'https://tools.ietf.org/html/rfc7231#section-6.5.1',
      title: 'Bad Request',
      status: 400,
      detail: 'La transición de estado solicitada no es válida según el ciclo de vida del pedido.',
      code: 'Orders.InvalidTransition',
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => mockProblemDetails,
    } as unknown as Response);

    try {
      await apiClient.updateOrderStatus('test-order-id', 4);
      expect.fail('Should have thrown an ApiClientError');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiClientError);
      const apiError = err as ApiClientError;
      expect(apiError.status).toBe(400);
      expect(apiError.code).toBe('Orders.InvalidTransition');
      expect(apiError.message).toBe(
        'La transición de estado solicitada no es válida según el ciclo de vida del pedido.'
      );
    }
  });

  it('correctly falls back to title if detail is missing', async () => {
    const mockProblemDetails = {
      title: 'Not Found',
      status: 404,
      code: 'Orders.NotFound',
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => mockProblemDetails,
    } as unknown as Response);

    try {
      await apiClient.getOrderById('non-existent-id');
      expect.fail('Should have thrown an ApiClientError');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiClientError);
      const apiError = err as ApiClientError;
      expect(apiError.status).toBe(404);
      expect(apiError.code).toBe('Orders.NotFound');
      expect(apiError.message).toBe('Not Found');
    }
  });

  it('correctly executes toggleProductStatus with PUT request', async () => {
    window.history.pushState({}, '', '/admin/inventario');
    setApiClientTenantSlug('la-granjita');
    const mockResponse = {
      productId: 1,
      isActive: false,
      productName: 'Combo Familiar 1 Pollo',
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    } as unknown as Response);

    const result = await apiClient.toggleProductStatus(1, false);
    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/catalog/products/1/status'),
      expect.objectContaining({
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Slug': 'la-granjita',
        },
        body: JSON.stringify({ productId: 1, isActive: false }),
      })
    );
  });

  it('correctly appends includeInactive=true when querying complete inventory menu', async () => {
    const mockMenu = { categories: [], totalProducts: 0 };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockMenu,
    } as unknown as Response);

    await apiClient.getActiveMenu(true);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/catalog/menu?includeInactive=true'),
      expect.objectContaining({
        method: 'GET',
      })
    );
  });

  it('correctly queries popular bestsellers products with limit and days parameters', async () => {
    const mockPopular = [{ id: 1, name: 'Pollo Asado', basePrice: 14.5, totalSold: 120 }];
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockPopular,
    } as unknown as Response);

    const result = await apiClient.getPopularProducts(6, 14, 'la-granjita');
    expect(result).toHaveLength(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/catalog/popular?limit=6&days=14'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'X-Tenant-Slug': 'la-granjita',
        }),
      })
    );
  });

  it('resolves tenant slug from dynamic storefront pathname before localStorage and returns null on platform root', () => {
    window.localStorage.setItem('delivery_active_tenant_slug', 'la-granjita');
    window.history.pushState({}, '', '/brasas-del-valle');

    expect(getApiClientTenantSlug()).toBe('brasas-del-valle');

    window.history.pushState({}, '', '/brasas-del-valle/repartidor');
    expect(getApiClientTenantSlug()).toBe('brasas-del-valle');

    window.history.pushState({}, '', '/');
    expect(getApiClientTenantSlug()).toBeNull();
  });

  it('correctly executes getDriverProfile and getDriverOrders', async () => {
    const mockProfile = {
      driverId: 'driver-uuid',
      userId: 'user-uuid',
      fullName: 'Carlos Repartidor',
      email: 'carlos@mesafy.com',
      phone: '099112233',
      vehicleType: 'Moto',
      isAvailable: true,
      todayDeliveredCount: 5,
      todayCashCollected: 125.5,
    };

    const mockOrders = {
      activeOrders: [],
      availableOrders: [],
      deliveredToday: [],
      shiftSummary: { completedCount: 5, cashCollected: 125.5, totalEarnings: 15.0 },
    };

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockProfile,
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockOrders,
      } as unknown as Response);

    const profile = await apiClient.getDriverProfile();
    expect(profile).toEqual(mockProfile);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/driver/me'),
      expect.objectContaining({ method: 'GET' })
    );

    const orders = await apiClient.getDriverOrders(2);
    expect(orders).toEqual(mockOrders);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/driver/orders?branchId=2'),
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('correctly executes claimDriverOrder and updateDriverStatus', async () => {
    const mockClaimed = {
      orderId: 'order-123',
      orderNumber: 1001,
      customerName: 'Juan Perez',
      status: 4, // OnTheWay
    };

    const mockStatusResponse = {
      driverId: 'driver-uuid',
      isAvailable: false,
      vehicleType: 'Moto',
      updatedAt: '2026-11-06T15:00:00Z',
    };

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockClaimed,
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockStatusResponse,
      } as unknown as Response);

    const claimed = await apiClient.claimDriverOrder('order-123');
    expect(claimed).toEqual(mockClaimed);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/driver/orders/order-123/claim'),
      expect.objectContaining({ method: 'POST' })
    );

    const updated = await apiClient.updateDriverStatus({ isAvailable: false });
    expect(updated).toEqual(mockStatusResponse);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/driver/status'),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ isAvailable: false }),
      })
    );
  });

  it('correctly identifies platform hosts and tenant subdomains', () => {
    expect(isPlatformHost('localhost')).toBe(true);
    expect(isPlatformHost('localhost:3005')).toBe(true);
    expect(isPlatformHost('mesafy.com')).toBe(true);
    expect(isPlatformHost('pedidos.lagranjita.com')).toBe(false);
    expect(isPlatformHost('pollos-al-carbon.ec')).toBe(false);

    expect(getTenantSubdomain('la-granjita.mesafy.com')).toBe('la-granjita');
    expect(getTenantSubdomain('api.mesafy.com')).toBeNull();
    expect(getTenantSubdomain('www.mesafy.com')).toBeNull();
    expect(getTenantSubdomain('localhost')).toBeNull();

    expect(getApiClientTenantDomain()).toBeNull();
  });
});

