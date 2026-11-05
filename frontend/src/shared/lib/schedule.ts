/**
 * Utilidades puras para el cálculo dinámico y en tiempo real del estado de
 * atención de sucursales según sus horarios de apertura y cierre (HH:mm).
 */

export interface BranchOperatingStatus {
  isOpen: boolean;
  isClosingSoon: boolean;
  statusLabel: string;
  detailLabel: string;
  badgeTone: "success" | "warning" | "neutral" | "danger";
  openingTime: string;
  closingTime: string;
  minutesRemaining?: number;
}

/**
 * Convierte una cadena de hora "HH:mm" a minutos desde las 00:00 (0 a 1439).
 */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr || typeof timeStr !== "string") return 0;
  const parts = timeStr.trim().split(":");
  const hours = Number.parseInt(parts[0] ?? "0", 10);
  const minutes = Number.parseInt(parts[1] ?? "0", 10);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return 0;
  return Math.min(Math.max(hours * 60 + minutes, 0), 1439);
}

/**
 * Evalúa si una sucursal está abierta, cerrada o próxima al cierre en base a la hora actual.
 * Contempla horarios regulares (ej. 10:30 - 21:30) y horarios nocturnos que cruzan medianoche (ej. 18:00 - 02:00).
 */
export function getBranchOperatingStatus(
  openingTime: string,
  closingTime: string,
  currentDate: Date = new Date()
): BranchOperatingStatus {
  const cleanOpening = openingTime?.trim() || "10:30";
  const cleanClosing = closingTime?.trim() || "21:30";

  const openMinutes = parseTimeToMinutes(cleanOpening);
  const closeMinutes = parseTimeToMinutes(cleanClosing);

  const currentMinutes = currentDate.getHours() * 60 + currentDate.getMinutes();

  const isCrossMidnight = closeMinutes <= openMinutes;

  let isOpen = false;
  let minutesToClose = 0;

  if (isCrossMidnight) {
    // Cruza la medianoche (ej. abre a las 18:00 (1080m) y cierra a las 02:00 (120m))
    isOpen = currentMinutes >= openMinutes || currentMinutes < closeMinutes;
    if (isOpen) {
      if (currentMinutes >= openMinutes) {
        minutesToClose = 1440 - currentMinutes + closeMinutes;
      } else {
        minutesToClose = closeMinutes - currentMinutes;
      }
    }
  } else {
    // Horario regular del mismo día (ej. 10:30 (630m) a 21:30 (1290m))
    isOpen = currentMinutes >= openMinutes && currentMinutes < closeMinutes;
    if (isOpen) {
      minutesToClose = closeMinutes - currentMinutes;
    }
  }

  const isClosingSoon = isOpen && minutesToClose > 0 && minutesToClose <= 30;

  if (isOpen) {
    if (isClosingSoon) {
      return {
        isOpen: true,
        isClosingSoon: true,
        statusLabel: "Cierra Pronto",
        detailLabel: `Cierra en ${minutesToClose} min (${cleanClosing})`,
        badgeTone: "warning",
        openingTime: cleanOpening,
        closingTime: cleanClosing,
        minutesRemaining: minutesToClose,
      };
    }

    return {
      isOpen: true,
      isClosingSoon: false,
      statusLabel: "Abierto Ahora",
      detailLabel: `Atención hasta las ${cleanClosing}`,
      badgeTone: "success",
      openingTime: cleanOpening,
      closingTime: cleanClosing,
      minutesRemaining: minutesToClose,
    };
  }

  // Si está cerrado, calcular si abre hoy más tarde o en el siguiente ciclo
  let detailLabel = `Abre a las ${cleanOpening}`;
  if (!isCrossMidnight && currentMinutes < openMinutes) {
    detailLabel = `Abre hoy a las ${cleanOpening}`;
  } else if (!isCrossMidnight && currentMinutes >= closeMinutes) {
    detailLabel = `Abre a las ${cleanOpening}`;
  }

  return {
    isOpen: false,
    isClosingSoon: false,
    statusLabel: "Cerrado Actualmente",
    detailLabel,
    badgeTone: "neutral",
    openingTime: cleanOpening,
    closingTime: cleanClosing,
  };
}

