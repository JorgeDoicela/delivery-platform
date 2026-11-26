'use client';

import { useEffect, useRef, useState } from 'react';
import { Map, Marker, Popup, NavigationControl, LngLatBounds, setWorkerUrl, type StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { createDriverDomMarker, createDestinationDomMarker, createBranchDomMarker } from './DriverMarker';
import { Navigation } from 'lucide-react';

interface OrderMapProps {
  origin?: {
    latitude: number;
    longitude: number;
    label?: string;
  };
  destination?: {
    latitude: number;
    longitude: number;
  };
  driverLocation?: {
    latitude: number;
    longitude: number;
    heading?: number;
  } | null;
  className?: string;
}

// Estilo raster predeterminado (OpenStreetMap) de alta resiliencia sin llaves de API
const DEFAULT_MAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    'osm-tiles': {
      type: 'raster',
      tiles: [
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'osm-tiles-layer',
      type: 'raster',
      source: 'osm-tiles',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

export function OrderMap({ origin, destination, driverLocation, className = '' }: OrderMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const driverMarkerRef = useRef<Marker | null>(null);
  const destinationMarkerRef = useRef<Marker | null>(null);
  const branchMarkerRef = useRef<Marker | null>(null);
  const initialCenterRef = useRef<[number, number]>([
    destination?.longitude ?? origin?.longitude ?? driverLocation?.longitude ?? -78.4845,
    destination?.latitude ?? origin?.latitude ?? driverLocation?.latitude ?? -0.1782,
  ]);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Inicialización del Mapa
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;
    if (typeof window !== 'undefined') {
      setWorkerUrl('/maplibre-gl-worker.mjs');
    }

    const styleUrl = process.env.NEXT_PUBLIC_MAP_STYLE_URL;
    const mapStyle = styleUrl && styleUrl.startsWith('http') && !styleUrl.includes('demotiles')
      ? styleUrl
      : DEFAULT_MAP_STYLE;

    const map = new Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: initialCenterRef.current,
      zoom: 14,
      pitch: 30,
      attributionControl: false,
    });

    map.addControl(
      new NavigationControl({
        showCompass: false,
        showZoom: true,
      }),
      'bottom-right'
    );

    map.on('load', () => {
      mapInstanceRef.current = map;
      setMapLoaded(true);
    });

    return () => {
      driverMarkerRef.current?.remove();
      driverMarkerRef.current = null;
      destinationMarkerRef.current?.remove();
      destinationMarkerRef.current = null;
      branchMarkerRef.current?.remove();
      branchMarkerRef.current = null;
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Marcador de Sucursal de Origen
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded || !origin) return;

    if (!branchMarkerRef.current) {
      const el = createBranchDomMarker();
      const label = origin.label || 'Sucursal de Despacho';
      const popup = new Popup({ offset: 25 }).setHTML(
        `<div style="font-family: sans-serif; font-size: 12px; font-weight: bold; padding: 4px; color: var(--text-strong, #0f172a);">${label}</div>`
      );

      const marker = new Marker({ element: el, anchor: 'bottom' })
        .setLngLat([origin.longitude, origin.latitude])
        .setPopup(popup)
        .addTo(map);

      branchMarkerRef.current = marker;
    } else {
      branchMarkerRef.current.setLngLat([origin.longitude, origin.latitude]);
    }
  }, [origin, mapLoaded]);

  // Marcador de Destino
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded || !destination) return;

    if (!destinationMarkerRef.current) {
      const el = createDestinationDomMarker();
      const popup = new Popup({ offset: 25 }).setHTML(
        '<div style="font-family: sans-serif; font-size: 12px; font-weight: bold; padding: 4px; color: var(--text-strong, #0f172a);">Destino de Entrega</div>'
      );

      const marker = new Marker({ element: el, anchor: 'bottom' })
        .setLngLat([destination.longitude, destination.latitude])
        .setPopup(popup)
        .addTo(map);

      destinationMarkerRef.current = marker;
    } else {
      destinationMarkerRef.current.setLngLat([destination.longitude, destination.latitude]);
    }
  }, [destination, mapLoaded]);

  // Ajuste inicial de encuadre (Bounds) entre Sucursal y Destino
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded || !destination || !origin || driverLocation) return;

    const bounds = new LngLatBounds();
    bounds.extend([origin.longitude, origin.latitude]);
    bounds.extend([destination.longitude, destination.latitude]);

    map.fitBounds(bounds, {
      padding: { top: 60, bottom: 60, left: 60, right: 60 },
      maxZoom: 15,
      duration: 1000,
    });
  }, [origin, destination, driverLocation, mapLoaded]);

  // Marcador del Repartidor (Posición en Tiempo Real y Heading)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded) return;

    if (!driverLocation) {
      if (driverMarkerRef.current) {
        driverMarkerRef.current.remove();
        driverMarkerRef.current = null;
      }
      return;
    }

    const { latitude, longitude, heading = 0 } = driverLocation;

    if (!driverMarkerRef.current) {
      const el = createDriverDomMarker(heading);
      const marker = new Marker({ element: el, anchor: 'center' })
        .setLngLat([longitude, latitude])
        .addTo(map);

      driverMarkerRef.current = marker;
    } else {
      driverMarkerRef.current.setLngLat([longitude, latitude]);

      // Actualizar rotación heading
      const markerElement = driverMarkerRef.current.getElement();
      const iconContainer = markerElement.querySelector('div > div:nth-child(2)') as HTMLElement | null;
      if (iconContainer) {
        iconContainer.style.transform = `rotate(${heading}deg)`;
      }
    }

    // Ajustar encuadre (Bounds) si ambos existen
    if (destination) {
      const bounds = new LngLatBounds();
      bounds.extend([destination.longitude, destination.latitude]);
      bounds.extend([longitude, latitude]);

      map.fitBounds(bounds, {
        padding: { top: 60, bottom: 60, left: 60, right: 60 },
        maxZoom: 16,
        duration: 1200,
      });
    }
  }, [driverLocation, destination, mapLoaded]);

  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (driverLocation) {
      map.flyTo({
        center: [driverLocation.longitude, driverLocation.latitude],
        zoom: 16,
        duration: 1000,
      });
    } else if (destination) {
      map.flyTo({
        center: [destination.longitude, destination.latitude],
        zoom: 15,
        duration: 1000,
      });
    }
  };

  return (
    <div className={`relative w-full h-64 sm:h-80 md:h-96 rounded-3xl overflow-hidden border border-surface-border shadow-xl bg-surface-canvas ${className}`}>
      {/* Contenedor del lienzo MapLibre WebGL */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Indicador de transmisión GPS únicamente cuando el repartidor está en ruta */}
      {driverLocation && (
        <div className="absolute top-3 left-3 z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-primary text-white border border-brand-primary-hover text-[10px] font-bold uppercase tracking-wider shadow-md">
            <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
            En vivo
          </span>
        </div>
      )}

      {/* Botón de Recentrado */}
      <button
        type="button"
        onClick={handleRecenter}
        title="Centrar mapa"
        aria-label="Centrar mapa"
        className="absolute top-3 right-3 z-10 p-2.5 rounded-full bg-surface-card/90 hover:bg-surface-card-hover backdrop-blur-md border border-surface-border text-text-strong shadow-lg transition-all active:scale-95 cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
      >
        <Navigation className="h-4 w-4 text-brand-primary" />
      </button>
    </div>
  );
}
