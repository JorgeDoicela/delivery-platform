'use client';

import { useEffect, useRef, useState } from 'react';
import { Map, Marker, Popup, NavigationControl, LngLatBounds, type StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { createDriverDomMarker, createDestinationDomMarker } from './DriverMarker';
import { Navigation, Compass, Layers } from 'lucide-react';

interface OrderMapProps {
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

export function OrderMap({ destination, driverLocation, className = '' }: OrderMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const driverMarkerRef = useRef<Marker | null>(null);
  const destinationMarkerRef = useRef<Marker | null>(null);
  const initialCenterRef = useRef<[number, number]>([
    destination?.longitude ?? driverLocation?.longitude ?? -78.4845,
    destination?.latitude ?? driverLocation?.latitude ?? -0.1782,
  ]);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Inicialización del Mapa
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

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
        visualizePitch: true,
        showCompass: true,
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
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

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
    <div className={`relative w-full h-80 sm:h-96 rounded-2xl overflow-hidden border border-surface-dark-border shadow-2xl bg-surface-dark ${className}`}>
      {/* Contenedor del lienzo MapLibre WebGL */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Barra de control flotante */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-dark-card/90 backdrop-blur-md border border-surface-dark-border text-[11px] font-semibold text-text-inverse-base shadow-md">
          <Layers className="h-3.5 w-3.5 text-brand-accent" />
          Rastreo Vectorial MapLibre
        </span>
        {driverLocation && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-accent/10 backdrop-blur-md border border-brand-accent/30 text-[11px] font-bold text-brand-accent animate-pulse shadow-md">
            <span className="h-2 w-2 rounded-full bg-brand-accent" />
            GPS Activo
          </span>
        )}
      </div>

      {/* Botón de Recentrado */}
      <button
        type="button"
        onClick={handleRecenter}
        title="Centrar mapa en posición activa"
        className="absolute top-3 right-3 z-10 p-2.5 rounded-xl bg-surface-dark-card/90 hover:bg-surface-dark-hover backdrop-blur-md border border-surface-dark-border text-text-inverse-base hover:text-text-inverse-strong shadow-lg transition-all active:scale-95"
      >
        <Navigation className="h-4 w-4" />
      </button>

      {/* Mensaje informativo si aún no hay repartidor transmitiendo */}
      {!driverLocation && (
        <div className="absolute bottom-3 left-3 right-14 z-10 p-2.5 rounded-xl bg-surface-dark-card/85 backdrop-blur-md border border-surface-dark-border text-[11px] text-text-inverse-muted flex items-center gap-2">
          <Compass className="h-4 w-4 text-text-inverse-subtle shrink-0" />
          <span>El mapa mostrará el movimiento en vivo en cuanto el repartidor retire la orden.</span>
        </div>
      )}
    </div>
  );
}
