/**
 * Utilidad de geocodificación inversa ligera basada en OpenStreetMap (Nominatim).
 * Convierte coordenadas (lat, lng) en un nombre de calle y sector legible en español
 * para evitar que el usuario deba escribir manualmente su dirección.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          "Accept-Language": "es",
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Reverse geocode HTTP error ${res.status}`);
    }

    const data = (await res.json()) as {
      display_name?: string;
      address?: {
        road?: string;
        pedestrian?: string;
        street?: string;
        residential?: string;
        house_number?: string;
        neighbourhood?: string;
        suburb?: string;
        quarter?: string;
        city_district?: string;
        city?: string;
        town?: string;
      };
    };

    const addr = data.address;
    if (addr) {
      const road = addr.road || addr.pedestrian || addr.street || addr.residential || "";
      const houseNumber = addr.house_number ? ` #${addr.house_number}` : "";
      const district = addr.neighbourhood || addr.suburb || addr.quarter || addr.city_district || "";
      const city = addr.city || addr.town || "";

      const primary = [road + houseNumber, district].filter(Boolean).join(", ");
      if (primary.trim().length >= 5) {
        return primary;
      }

      const secondary = [road, city].filter(Boolean).join(", ");
      if (secondary.trim().length >= 5) {
        return secondary;
      }

      if (data.display_name) {
        const shortName = data.display_name.split(",").slice(0, 2).join(",").trim();
        if (shortName.length >= 5) {
          return shortName;
        }
      }
    }

    if (data.display_name) {
      const shortName = data.display_name.split(",").slice(0, 2).join(",").trim();
      if (shortName.length >= 5) {
        return shortName;
      }
    }
  } catch {
    // Tolerancia ante desconexión o timeout de la red
  }

  return `Ubicación GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
}

