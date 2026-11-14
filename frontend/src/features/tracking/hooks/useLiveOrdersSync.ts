"use client";

import { useEffect, useCallback, useRef } from "react";
import * as signalR from "@microsoft/signalr";

interface UseLiveOrdersSyncOptions {
  isAuthenticated: boolean;
  userId?: string;
  orderIds: string[];
  onSync: () => void | Promise<void>;
}

export function useLiveOrdersSync({
  isAuthenticated,
  userId,
  orderIds,
  onSync,
}: UseLiveOrdersSyncOptions) {
  const onSyncRef = useRef(onSync);

  useEffect(() => {
    onSyncRef.current = onSync;
  }, [onSync]);

  const safeSync = useCallback(() => {
    void onSyncRef.current();
  }, []);

  // 1. Sincronización al montar y al recuperar foco o visibilidad de pestaña (desbloqueo de móvil / cambio de app)
  useEffect(() => {
    if (!isAuthenticated) return;

    safeSync();

    const handleFocusOrVisible = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        safeSync();
      }
    };

    window.addEventListener("visibilitychange", handleFocusOrVisible);
    window.addEventListener("focus", handleFocusOrVisible);

    return () => {
      window.removeEventListener("visibilitychange", handleFocusOrVisible);
      window.removeEventListener("focus", handleFocusOrVisible);
    };
  }, [isAuthenticated, safeSync]);

  // 2. Conexión push por WebSockets en tiempo real vía SignalR TrackingHub
  useEffect(() => {
    if (!isAuthenticated) return;

    let isSubscribed = true;
    const joinedOrderIds = new Set<string>();

    const baseUrl =
      process.env.NEXT_PUBLIC_WS_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      (typeof window !== "undefined" ? window.location.origin : "http://localhost:5005");
    const wsUrl = baseUrl.endsWith("/hubs") ? `${baseUrl}/tracking` : `${baseUrl}/hubs/tracking`;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(wsUrl)
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.None)
      .build();

    const joinGroups = async (ids: string[]) => {
      if (connection.state !== signalR.HubConnectionState.Connected) return;

      // Canal directo del cliente para recibir altas y bajas de pedidos en tiempo real
      if (userId) {
        try {
          await connection.invoke("JoinUserTracking", userId);
        } catch {
          // Ignorado en desconexión transitoria
        }
      }

      // Canales individuales de telemetría por orden activa
      for (const id of ids) {
        if (!joinedOrderIds.has(id)) {
          try {
            await connection.invoke("JoinOrderTracking", id);
            joinedOrderIds.add(id);
          } catch {
            // Ignorado en desconexión transitoria
          }
        }
      }
    };

    // Evento de cambio de orden específica
    connection.on("OrderStatusChanged", () => {
      if (!isSubscribed) return;
      safeSync();
    });

    // Evento push de actualización en el listado de pedidos del usuario
    connection.on("OrdersListUpdated", () => {
      if (!isSubscribed) return;
      safeSync();
    });

    connection.onreconnected(async () => {
      if (!isSubscribed) return;
      joinedOrderIds.clear();
      await joinGroups(orderIds);
      safeSync();
    });

    connection.onclose(() => {
      if (isSubscribed) {
        joinedOrderIds.clear();
      }
    });

    const startPromise = connection
      .start()
      .then(async () => {
        if (!isSubscribed) {
          await connection.stop().catch(() => {});
          return;
        }
        await joinGroups(orderIds);
      })
      .catch(() => {});

    return () => {
      isSubscribed = false;
      joinedOrderIds.clear();
      void startPromise.finally(async () => {
        if (connection.state === signalR.HubConnectionState.Connected && userId) {
          await connection.invoke("LeaveUserTracking", userId).catch(() => {});
        }
        if (connection.state !== signalR.HubConnectionState.Disconnected) {
          await connection.stop().catch(() => {});
        }
      });
    };
  }, [isAuthenticated, safeSync, orderIds, userId]);
}
