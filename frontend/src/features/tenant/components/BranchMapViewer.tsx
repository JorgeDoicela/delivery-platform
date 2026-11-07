"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Map, Marker, NavigationControl, setWorkerUrl, type StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { LocateFixed, ExternalLink } from "lucide-react";

interface BranchMapViewerProps {
  branchName: string;
  address: string;
  latitude: number;
  longitude: number;
  imageUrl?: string;
  googleMapsUrl: string;
}

const OSM_MAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    "osm-tiles": {
      type: "raster",
      tiles: [
        "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution: "&copy; OpenStreetMap contributors",
    },
  },
  layers: [
    {
      id: "osm-tiles-layer",
      type: "raster",
      source: "osm-tiles",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

export function BranchMapViewer({
  branchName,
  latitude,
  longitude,
  imageUrl = "/images/tenants/la-granjita/banners/promo-hecho-a-la-brasa.jpg",
  googleMapsUrl,
}: BranchMapViewerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const [isCentered, setIsCentered] = useState(true);

  const handleRecenter = useCallback(() => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({
      center: [longitude, latitude],
      zoom: 16,
      speed: 1.4,
      curve: 1.2,
      essential: true,
    });
    setIsCentered(true);
  }, [latitude, longitude]);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (typeof window !== "undefined") {
      setWorkerUrl("/maplibre-gl-worker.mjs");
    }

    const map = new Map({
      container: mapContainerRef.current,
      style: OSM_MAP_STYLE,
      center: [longitude, latitude],
      zoom: 16,
      maxZoom: 19,
      minZoom: 10,
      pitchWithRotate: false,
      dragRotate: false,
    });

    map.addControl(
      new NavigationControl({ showCompass: false, visualizePitch: false }),
      "top-right"
    );

    // Pin compacto sobre la ubicación con miniatura circular limpia
    const markerEl = document.createElement("div");
    markerEl.className = "branch-marker-container flex flex-col items-center select-none cursor-pointer";
    markerEl.setAttribute("title", branchName);
    markerEl.setAttribute("aria-label", `Ubicación de ${branchName}`);
    markerEl.innerHTML = `
      <div class="relative w-9 h-9 rounded-full overflow-hidden border-2 border-white shadow-lg bg-neutral-900 shrink-0">
        <img src="${imageUrl}" alt="${branchName}" class="w-full h-full object-cover" />
      </div>
      <div class="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-white -mt-0.5 filter drop-shadow-sm"></div>
      <div class="w-2 h-2 rounded-full bg-brand-primary border-1.5 border-white shadow-xs -mt-1"></div>
    `;

    markerEl.addEventListener("click", () => {
      handleRecenter();
    });

    const marker = new Marker({
      element: markerEl,
      anchor: "bottom",
    })
      .setLngLat([longitude, latitude])
      .addTo(map);

    markerRef.current = marker;
    mapRef.current = map;

    // Detectar cuando el usuario se desplaza fuera del centro
    map.on("dragstart", () => {
      setIsCentered(false);
    });

    return () => {
      marker.remove();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [latitude, longitude, branchName, imageUrl, handleRecenter]);

  // Si cambian las coordenadas al cambiar de sucursal
  useEffect(() => {
    if (mapRef.current && markerRef.current) {
      markerRef.current.setLngLat([longitude, latitude]);
      mapRef.current.flyTo({
        center: [longitude, latitude],
        zoom: 16,
        essential: true,
      });
      setIsCentered(true);
    }
  }, [latitude, longitude]);

  return (
    <div className="relative w-full h-full min-h-[380px] lg:min-h-[460px] flex flex-col overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-full min-h-[380px] lg:min-h-[460px]" />

      {/* Botonera Flotante Inferior Derecha */}
      <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2.5 z-10 pointer-events-auto">
        {/* Botón de Encontrar / Centrar automáticamente en el local */}
        <button
          type="button"
          onClick={handleRecenter}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold font-display uppercase tracking-wider transition-all duration-200 shadow-lg active:scale-95 cursor-pointer backdrop-blur-md ${
            isCentered
              ? "bg-surface-card/95 text-text-strong border border-surface-border hover:bg-surface-card hover:border-brand-primary"
              : "bg-brand-primary text-white hover:bg-brand-primary-hover ring-2 ring-white/50 animate-bounce-subtle"
          }`}
          title="Centrar mapa en la ubicación del local"
          aria-label="Reubicar y centrar el mapa en el restaurante"
        >
          <LocateFixed className={`w-3.5 h-3.5 ${isCentered ? "text-brand-primary" : "text-white"}`} />
          <span>Centrar Local</span>
        </button>

        {/* Abrir en Google Maps */}
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-neutral-950/90 hover:bg-neutral-900 text-white text-xs font-bold font-display uppercase tracking-wider transition-all shadow-lg active:scale-95 backdrop-blur-sm cursor-pointer border border-white/10"
        >
          <span>Abrir en Google Maps</span>
          <ExternalLink className="w-3.5 h-3.5 text-white/80" />
        </a>
      </div>
    </div>
  );
}

