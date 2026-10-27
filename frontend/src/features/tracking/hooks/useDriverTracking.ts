'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { apiClient } from '@/shared/lib/api-client';

interface UseDriverTrackingProps {
  orderId: string;
  driverId?: string;
  isActive: boolean;
  destinationLat?: number;
  destinationLng?: number;
}

export function useDriverTracking({
  orderId,
  driverId = 'driver_1',
  isActive,
  destinationLat = -0.1782,
  destinationLng = -78.4845,
}: UseDriverTrackingProps) {
  const [currentPosition, setCurrentPosition] = useState<{
    latitude: number;
    longitude: number;
    heading?: number;
  }>({
    latitude: -0.1800,
    longitude: -78.4800,
    heading: 0,
  });

  const [lastSentAt, setLastSentAt] = useState<Date | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [useSimulation, setUseSimulation] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  const sendLocation = useCallback(
    async (lat: number, lng: number, heading?: number) => {
      if (!orderId || !isActive) return;
      setIsSending(true);
      try {
        await apiClient.ingestDriverLocation(driverId, orderId, lat, lng, heading);
        setLastSentAt(new Date());
      } catch {
        // Error de red temporal al enviar posición
      } finally {
        setIsSending(false);
      }
    },
    [orderId, driverId, isActive]
  );

  // Manejo de Geolocalización Real
  useEffect(() => {
    if (!isActive || useSimulation) {
      if (watchIdRef.current !== null && typeof navigator !== 'undefined') {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, heading } = pos.coords;
          setCurrentPosition({
            latitude,
            longitude,
            heading: heading ?? undefined,
          });
          sendLocation(latitude, longitude, heading ?? undefined);
        },
        () => {
          // Si el usuario niega permisos o no hay satelite en localhost, activar simulacion
          setUseSimulation(true);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 3000,
          timeout: 10000,
        }
      );
    } else {
      // Si la API de geolocalizacion no existe, diferir la simulacion al siguiente tick
      const timer = setTimeout(() => setUseSimulation(true), 0);
      return () => clearTimeout(timer);
    }

    return () => {
      if (watchIdRef.current !== null && typeof navigator !== 'undefined') {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [isActive, useSimulation, sendLocation]);

  // Simulación hacia el destino (para entornos de desarrollo en localhost)
  useEffect(() => {
    if (!isActive || !useSimulation) return;

    const interval = setInterval(() => {
      setCurrentPosition((prev) => {
        // Interpolar paso a paso hacia el destino
        const step = 0.0003;
        const dLat = destinationLat - prev.latitude;
        const dLng = destinationLng - prev.longitude;
        const dist = Math.hypot(dLat, dLng);

        if (dist < 0.0001) {
          return prev; // Ya llegó
        }

        const nextLat = prev.latitude + (dLat / dist) * step;
        const nextLng = prev.longitude + (dLng / dist) * step;
        const nextHeading = (Math.atan2(dLng, dLat) * 180) / Math.PI;

        sendLocation(nextLat, nextLng, nextHeading);

        return {
          latitude: nextLat,
          longitude: nextLng,
          heading: nextHeading,
        };
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [isActive, useSimulation, destinationLat, destinationLng, sendLocation]);

  return {
    currentPosition,
    lastSentAt,
    isSending,
    useSimulation,
    setUseSimulation,
  };
}
