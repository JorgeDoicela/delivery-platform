'use client';

import { useEffect, useState, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import { apiClient } from '@/shared/lib/api-client';
import { OrderDto, OrderStatus } from '@/shared/types/api';

interface UseOrderTrackingProps {
  orderId: string;
}

interface UseOrderTrackingReturn {
  order: OrderDto | null;
  loading: boolean;
  error: string | null;
  driverLocation: { latitude: number; longitude: number; heading?: number } | null;
  refresh: () => Promise<void>;
}

export function useOrderTracking({ orderId }: UseOrderTrackingProps): UseOrderTrackingReturn {
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [loading, setLoading] = useState(Boolean(orderId));
  const [error, setError] = useState<string | null>(
    orderId ? null : 'Identificador de orden no proporcionado.'
  );
  const [driverLocation, setDriverLocation] = useState<{
    latitude: number;
    longitude: number;
    heading?: number;
  } | null>(null);

  const refresh = useCallback(async () => {
    if (!orderId) return;
    try {
      const data = await apiClient.getOrderById(orderId);
      setOrder(data);
      setError(null);
      if (data.status === OrderStatus.OnTheWay) {
        try {
          const loc = await apiClient.getDriverLocation(orderId);
          if (loc && typeof loc.latitude === 'number' && typeof loc.longitude === 'number') {
            setDriverLocation({
              latitude: loc.latitude,
              longitude: loc.longitude,
              heading: loc.heading,
            });
          }
        } catch {
          // Normal si aún no hay telemetría activa en Redis
        }
      }
    } catch {
      setError('No se pudo cargar la orden especificada.');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    let isSubscribed = true;

    if (!orderId) {
      return;
    }

    const fetchCurrentDriverLocation = async () => {
      try {
        const loc = await apiClient.getDriverLocation(orderId);
        if (isSubscribed && loc && typeof loc.latitude === 'number' && typeof loc.longitude === 'number') {
          setDriverLocation({
            latitude: loc.latitude,
            longitude: loc.longitude,
            heading: loc.heading,
          });
        }
      } catch {
        // Normal si aún no hay repartidor transmitiendo en Redis GEO
      }
    };

    const loadInitialOrder = async () => {
      try {
        const data = await apiClient.getOrderById(orderId);
        if (isSubscribed) {
          setOrder(data);
          setError(null);
          setLoading(false);
          if (data.status === OrderStatus.OnTheWay) {
            void fetchCurrentDriverLocation();
          }
        }
      } catch {
        if (isSubscribed) {
          setError('No se pudo cargar la orden especificada.');
          setLoading(false);
        }
      }
    };

    void loadInitialOrder();

    // Conexión WebSockets SignalR al TrackingHub
    const baseUrl =
      process.env.NEXT_PUBLIC_WS_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5005');
    const wsUrl = baseUrl.endsWith('/hubs') ? `${baseUrl}/tracking` : `${baseUrl}/hubs/tracking`;
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(wsUrl)
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.None)
      .build();

    const startPromise = connection
      .start()
      .then(async () => {
        if (!isSubscribed) {
          await connection.stop().catch(() => {});
          return;
        }
        await connection.invoke('JoinOrderTracking', orderId).catch(() => {});
      })
      .catch(() => {});

    // Escucha de transición de estado
    connection.on('OrderStatusChanged', (payload: string | { orderId?: string; status: OrderStatus }) => {
      if (!isSubscribed) return;
      let nextStatus: OrderStatus | undefined;
      if (typeof payload === 'string') {
        const enumVal = OrderStatus[payload as keyof typeof OrderStatus];
        if (enumVal) {
          nextStatus = enumVal;
        }
      } else if (payload && typeof payload === 'object' && payload.status) {
        nextStatus = payload.status;
      }

      if (nextStatus) {
        setOrder((prev) => (prev ? { ...prev, status: nextStatus } : null));
        if (nextStatus === OrderStatus.OnTheWay) {
          void fetchCurrentDriverLocation();
        }
      }
    });

    // Escucha de telemetría GPS del repartidor
    connection.on('ReceiveDriverLocation', (latitude: number, longitude: number, heading?: number) => {
      if (isSubscribed) {
        setDriverLocation({ latitude, longitude, heading });
      }
    });

    connection.on('DriverLocationUpdated', (data: { orderId?: string; latitude: number; longitude: number; heading?: number }) => {
      if (isSubscribed && (!data.orderId || data.orderId === orderId)) {
        setDriverLocation({ latitude: data.latitude, longitude: data.longitude, heading: data.heading });
      }
    });

    // Polling de respaldo cada 20 segundos
    const interval = setInterval(loadInitialOrder, 20000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
      void startPromise.finally(async () => {
        if (connection.state === signalR.HubConnectionState.Connected) {
          await connection.invoke('LeaveOrderTracking', orderId).catch(() => {});
        }
        if (connection.state !== signalR.HubConnectionState.Disconnected) {
          await connection.stop().catch(() => {});
        }
      });
    };
  }, [orderId]);

  return {
    order,
    loading,
    error,
    driverLocation,
    refresh,
  };
}
