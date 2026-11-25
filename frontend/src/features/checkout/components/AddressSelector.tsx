'use client';

import { useEffect, useRef, useState } from 'react';
import { Map, Marker, NavigationControl, setWorkerUrl, type StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Crosshair, AlertCircle } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

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
      <div style="background: var(--brand-primary, #e4002b); color: #ffffff; border-radius: 9999px; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; border: 2.5px solid var(--surface-card, #ffffff); box-shadow: 0 4px 14px var(--brand-primary-muted, rgba(228, 0, 43, 0.4));">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
      </div>
      <div style="width: 3px; height: 10px; background: var(--brand-primary, #e4002b);"></div>
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
    const [isLocating, setIsLocating] = useState(false);
    const [gpsError, setGpsError] = useState<string | null>(null);

    useEffect(() => {
        if (!mapContainerRef.current || mapInstanceRef.current) return;
        if (typeof window !== 'undefined') {
            setWorkerUrl('/maplibre-gl-worker.mjs');
        }

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

        map.addControl(new NavigationControl({ showCompass: true, showZoom: true }), 'top-right');

        const pinEl = createPinDomElement();
        const marker = new Marker({ element: pinEl, draggable: true })
            .setLngLat([initialCoordsRef.current.lng, initialCoordsRef.current.lat])
            .addTo(map);

        marker.on('dragend', () => {
            const lngLat = marker.getLngLat();
            onSelectRef.current(lngLat.lat, lngLat.lng);
        });

        map.on('click', (e) => {
            marker.setLngLat(e.lngLat);
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

    const applyPosition = (latitude: number, longitude: number) => {
        if (mapInstanceRef.current && markerRef.current) {
            mapInstanceRef.current.flyTo({ center: [longitude, latitude], zoom: 16 });
            markerRef.current.setLngLat([longitude, latitude]);
        }
        setGpsError(null);
        onLocationSelect(latitude, longitude);
    };

    const handleUseCurrentLocation = async () => {
        setGpsError(null);
        setIsLocating(true);

        try {
            if (Capacitor.isNativePlatform()) {
                const perm = await Geolocation.requestPermissions();
                if (perm.location !== 'granted' && perm.coarseLocation !== 'granted') {
                    setGpsError('Permiso de ubicación denegado. Activa el GPS en los ajustes de tu teléfono.');
                    return;
                }
                const pos = await Geolocation.getCurrentPosition({
                    enableHighAccuracy: true,
                    timeout: 10000,
                });
                applyPosition(pos.coords.latitude, pos.coords.longitude);
                return;
            }

            if (!navigator.geolocation) {
                setGpsError('Tu navegador no soporta geolocalización GPS.');
                return;
            }

            await new Promise<void>((resolve) => {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        applyPosition(pos.coords.latitude, pos.coords.longitude);
                        resolve();
                    },
                    (err) => {
                        if (err.code === err.PERMISSION_DENIED) {
                            setGpsError('Permiso de ubicación bloqueado. Activa la ubicación en tu dispositivo o permite el acceso en el navegador.');
                        } else if (err.code === err.POSITION_UNAVAILABLE) {
                            setGpsError('No se pudo obtener tu señal GPS. Verifica que la ubicación del dispositivo esté encendida.');
                        } else {
                            setGpsError('Tiempo de espera agotado al detectar tu GPS. Intenta nuevamente.');
                        }
                        resolve();
                    },
                    { timeout: 10000, enableHighAccuracy: true }
                );
            });
        } catch {
            setGpsError('No se pudo activar el GPS. Verifica que la ubicación esté encendida.');
        } finally {
            setIsLocating(false);
        }
    };

    return (
        <div className="space-y-2">
            <div className="relative w-full h-64 rounded-2xl overflow-hidden border border-surface-border shadow-inner bg-surface-canvas">
                <div ref={mapContainerRef} className="w-full h-full" />

                {/* Botón flotante para activar y detectar GPS rápidamente */}
                <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={isLocating}
                    className="absolute bottom-3 right-3 z-10 flex items-center gap-2 px-3.5 py-2 rounded-full bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                    <Crosshair className={`w-4 h-4 text-white ${isLocating ? 'animate-spin' : ''}`} />
                    <span>{isLocating ? 'Activando GPS...' : 'Activar mi GPS'}</span>
                </button>
            </div>

            {gpsError && (
                <div
                    role="alert"
                    className="p-3 rounded-xl border border-surface-border bg-surface-canvas flex items-center justify-between gap-2 text-xs text-text-strong"
                >
                    <div className="flex items-start gap-2 min-w-0">
                        <AlertCircle className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
                        <span className="leading-snug">{gpsError}</span>
                    </div>
                    <button
                        type="button"
                        onClick={handleUseCurrentLocation}
                        disabled={isLocating}
                        className="px-3 py-1.5 rounded-full bg-brand-primary text-white text-[11px] font-bold shrink-0 cursor-pointer active:scale-95"
                    >
                        Reintentar
                    </button>
                </div>
            )}
        </div>
    );
}
