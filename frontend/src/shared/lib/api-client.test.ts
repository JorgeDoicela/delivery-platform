import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient, ApiClientError } from './api-client';

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
});

