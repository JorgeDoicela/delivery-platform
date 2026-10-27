'use client';

import React from 'react';

interface DriverMarkerProps {
  heading?: number;
}

export function DriverMarkerElement({ heading = 0 }: DriverMarkerProps) {
  return (
    <div className="relative flex items-center justify-center">
      {/* Halo de pulso */}
      <span className="absolute h-10 w-10 rounded-full bg-amber-500/30 animate-ping" />
      {/* Contenedor con rotación de rumbo (heading) */}
      <div
        className="relative z-10 flex items-center justify-center h-10 w-10 rounded-full bg-neutral-900 border-2 border-amber-500 shadow-xl text-amber-400 transition-transform duration-300 ease-out"
        style={{ transform: `rotate(${heading}deg)` }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5 text-amber-400"
        >
          <polygon points="12 2 19 21 12 17 5 21 12 2" />
        </svg>
      </div>
    </div>
  );
}

/**
 * Crea un elemento DOM nativo para el marcador de conductor en MapLibre GL.
 */
export function createDriverDomMarker(heading = 0): HTMLDivElement {
  const container = document.createElement('div');
  container.className = 'driver-maplibre-marker';
  container.style.cursor = 'pointer';
  container.innerHTML = `
    <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px;">
      <div style="position: absolute; width: 40px; height: 40px; border-radius: 9999px; background: rgba(245, 158, 11, 0.35); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="position: relative; z-index: 10; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 9999px; background: #0a0a0a; border: 2.5px solid #f59e0b; box-shadow: 0 4px 12px rgba(0,0,0,0.5); transform: rotate(${heading}deg); transition: transform 0.3s ease-out;">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
        </svg>
      </div>
    </div>
  `;
  return container;
}

/**
 * Crea un elemento DOM nativo para el marcador de destino en MapLibre GL.
 */
export function createDestinationDomMarker(): HTMLDivElement {
  const container = document.createElement('div');
  container.className = 'destination-maplibre-marker';
  container.innerHTML = `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
      <div style="background: #dc2626; color: white; border-radius: 9999px; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 3px 10px rgba(0,0,0,0.4);">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
      </div>
      <div style="width: 2px; height: 8px; background: #dc2626;"></div>
    </div>
  `;
  return container;
}
