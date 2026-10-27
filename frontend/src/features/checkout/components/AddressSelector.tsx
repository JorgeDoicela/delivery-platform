'use client';

import { useEffect, useRef, useState } from 'react';
import { Map, Marker, NavigationControl, type StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPin, Crosshair, Check } from 'lucide-react';

interface AddressSelectorProps {
  initialLat?: number;
  initialLng?: number;
  onLocationSelect: (lat: number, lng: number) => void;
}

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

function createPinDomElement(): HTMLDivElement {
  const container = document.createElement('div');
  container.className = 'address-selector-pin';
  container.style.cursor = 'grab';
  container.innerHTML = `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translateY(-16px);">
      <div style="background: #f97316; color: white; border-radius: 9999px; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; border: 2.5px solid white; box-shadow: 0 4px 14px rgba(249, 115, 22, 0.45);">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
      </div>
      <div style="width: 3px; height: 10px; background: #f97316;"></div>
      <div style="width: 8px; height: 3px; border-radius: 9999px; background: rgba(0,0,0,0.25);"></div>
    </div>
  `;
  return container;
}

export function AddressSelector({
  initialLat = -0.1782,
  initialLng = -78.4845,
  onLocationSelect,
}: AddressSelectorProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const onSelectRef = useRef(onLocationSelect);
  useEffect(() => {
    onSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);

  const initialCoordsRef = useRef({ lat: initialLat, lng: initialLng });

  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({
    lat: initialLat,
    lng: initialLng,
  });
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const styleUrl = process.env.NEXT_PUBLIC_MAP_STYLE_URL;
    const mapStyle =
      styleUrl && styleUrl.startsWith('http') && !styleUrl.includes('demotiles')
        ? styleUrl
        : DEFAULT_MAP_STYLE;

    const map = new Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: [initialCoordsRef.current.lng, initialCoordsRef.current.lat],
      zoom: 14,
      attributionControl: false,
    });

    map.addControl(new NavigationControl({ showCompass: true, showZoom: true }), 'bottom-right');

    const pinEl = createPinDomElement();
    const marker = new Marker({ element: pinEl, draggable: true })
      .setLngLat([initialCoordsRef.current.lng, initialCoordsRef.current.lat])
      .addTo(map);

    marker.on('dragend', () => {
      const lngLat = marker.getLngLat();
      setCurrentCoords({ lat: lngLat.lat, lng: lngLat.lng });
      onSelectRef.current(lngLat.lat, lngLat.lng);
    });

    map.on('click', (e) => {
      marker.setLngLat(e.lngLat);
      setCurrentCoords({ lat: e.lngLat.lat, lng: e.lngLat.lng });
      onSelectRef.current(e.lngLat.lat, e.lngLat.lng);
    });

    markerRef.current = marker;
    mapInstanceRef.current = map;

    return () => {
      marker.remove();
      markerRef.current = null;
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCurrentCoords({ lat: latitude, lng: longitude });

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.flyTo({ center: [longitude, latitude], zoom: 16 });
          markerRef.current.setLngLat([longitude, latitude]);
        }
        onLocationSelect(latitude, longitude);
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="space-y-3">
      <div className="relative w-full h-64 rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Botón flotante para ubicar GPS */}
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/95 hover:bg-white text-slate-800 text-xs font-semibold shadow-md border border-slate-200 backdrop-blur-sm transition-all active:scale-95 disabled:opacity-50"
        >
          <Crosshair className={`w-3.5 h-3.5 text-orange-600 ${isLocating ? 'animate-spin' : ''}`} />
          <span>{isLocating ? 'Buscando...' : 'Mi ubicación actual'}</span>
        </button>

        {/* Indicador de ayuda */}
        <div className="absolute bottom-3 left-3 right-14 z-10 p-2 rounded-xl bg-white/90 backdrop-blur-sm border border-slate-200 text-[11px] text-slate-600 shadow-sm flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
          <span>Haz clic o arrastra el pin naranja a tu puerta exacta.</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 font-mono bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
        <span>Lat: {currentCoords.lat.toFixed(5)}, Lng: {currentCoords.lng.toFixed(5)}</span>
        <span className="flex items-center gap-1 text-emerald-600 font-semibold font-sans">
          <Check className="w-3.5 h-3.5" />
          Punto fijado
        </span>
      </div>
    </div>
  );
}
