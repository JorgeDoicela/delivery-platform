export interface CountryCallingCode {
  code: string;       // ISO 2 letras (ej: "EC")
  name: string;       // Nombre del país (ej: "Ecuador")
  dialCode: string;   // Prefijo telefónico con + (ej: "+593")
  placeholder: string;// Ejemplo de número local (ej: "98 765 4321")
  minLength: number;  // Mínimo de dígitos locales permitidos
  maxLength: number;  // Máximo estricto de dígitos locales permitidos
}

export const SUPPORTED_COUNTRIES: CountryCallingCode[] = [
  // Ecuador: celular sin 0 inicial = 9 dígitos (ej: 987654321)
  { code: "EC", name: "Ecuador", dialCode: "+593", placeholder: "98 765 4321", minLength: 9, maxLength: 9 },
  // Colombia: celular nacional = 10 dígitos (ej: 3001234567)
  { code: "CO", name: "Colombia", dialCode: "+57", placeholder: "300 123 4567", minLength: 10, maxLength: 10 },
  // Perú: celular = 9 dígitos (ej: 912345678)
  { code: "PE", name: "Perú", dialCode: "+51", placeholder: "912 345 678", minLength: 9, maxLength: 9 },
  // EE.UU. / Canadá: formato NANP = 10 dígitos (ej: 2025550123)
  { code: "US", name: "Estados Unidos / Canadá", dialCode: "+1", placeholder: "202 555 0123", minLength: 10, maxLength: 10 },
  // España: móvil o fijo = 9 dígitos (ej: 612345678)
  { code: "ES", name: "España", dialCode: "+34", placeholder: "612 345 678", minLength: 9, maxLength: 9 },
  // México: nacional móvil/fijo = 10 dígitos (ej: 5512345678)
  { code: "MX", name: "México", dialCode: "+52", placeholder: "55 1234 5678", minLength: 10, maxLength: 10 },
  // Argentina: 10 dígitos con código de área (ej: 1112345678)
  { code: "AR", name: "Argentina", dialCode: "+54", placeholder: "11 1234 5678", minLength: 10, maxLength: 10 },
  // Chile: móvil = 9 dígitos (ej: 912345678)
  { code: "CL", name: "Chile", dialCode: "+56", placeholder: "9 1234 5678", minLength: 9, maxLength: 9 },
  // Venezuela: móvil = 10 dígitos (ej: 4121234567)
  { code: "VE", name: "Venezuela", dialCode: "+58", placeholder: "412 123 4567", minLength: 10, maxLength: 10 },
  // Bolivia: móvil = 8 dígitos (ej: 71234567)
  { code: "BO", name: "Bolivia", dialCode: "+591", placeholder: "712 34567", minLength: 8, maxLength: 8 },
  // Panamá: móvil = 8 dígitos (ej: 61234567)
  { code: "PA", name: "Panamá", dialCode: "+507", placeholder: "6123 4567", minLength: 8, maxLength: 8 },
  // Costa Rica: 8 dígitos (ej: 81234567)
  { code: "CR", name: "Costa Rica", dialCode: "+506", placeholder: "8123 4567", minLength: 8, maxLength: 8 },
  // Rep. Dominicana: 10 dígitos (ej: 8091234567)
  { code: "DO", name: "Rep. Dominicana", dialCode: "+1809", placeholder: "809 123 4567", minLength: 10, maxLength: 10 },
  // Uruguay: móvil = 8 dígitos (ej: 91234567)
  { code: "UY", name: "Uruguay", dialCode: "+598", placeholder: "91 234 567", minLength: 8, maxLength: 8 },
  // Paraguay: móvil = 9 dígitos (ej: 981123456)
  { code: "PY", name: "Paraguay", dialCode: "+595", placeholder: "981 123 456", minLength: 9, maxLength: 9 },
  // Italia: 9 a 10 dígitos (ej: 3123456789)
  { code: "IT", name: "Italia", dialCode: "+39", placeholder: "312 345 6789", minLength: 9, maxLength: 10 },
];

export const DEFAULT_COUNTRY = SUPPORTED_COUNTRIES[0]; // Ecuador (+593, 9 dígitos)

/**
 * Parsea un número de teléfono crudo a país y número local.
 */
export function parsePhoneNumber(rawPhone: string | null | undefined): {
  country: CountryCallingCode;
  localNumber: string;
} {
  if (!rawPhone || !rawPhone.trim()) {
    return { country: DEFAULT_COUNTRY, localNumber: "" };
  }

  const clean = rawPhone.trim();

  // Si viene con formato +XXX...
  if (clean.startsWith("+")) {
    const sorted = [...SUPPORTED_COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
    for (const c of sorted) {
      if (clean.startsWith(c.dialCode)) {
        const local = clean.slice(c.dialCode.length).trim();
        return {
          country: c,
          localNumber: local.slice(0, c.maxLength),
        };
      }
    }
  }

  // Si empieza con 593 directo (sin +)
  if (clean.startsWith("593") && clean.length >= 11) {
    const local = clean.slice(3).trim();
    return {
      country: DEFAULT_COUNTRY,
      localNumber: local.slice(0, DEFAULT_COUNTRY.maxLength),
    };
  }

  // Si es un número local que empieza con 0 (ej: 0987654321), remover el 0
  if (clean.startsWith("0") && clean.length >= 9) {
    const stripped = clean.replace(/^0+/, "");
    return {
      country: DEFAULT_COUNTRY,
      localNumber: stripped.slice(0, DEFAULT_COUNTRY.maxLength),
    };
  }

  // Fallback por defecto a Ecuador truncado al máximo permitido
  return {
    country: DEFAULT_COUNTRY,
    localNumber: clean.replace(/\D/g, "").slice(0, DEFAULT_COUNTRY.maxLength),
  };
}

/**
 * Normaliza y formatea a estándar E.164 (+[código][número]).
 */
export function formatToE164(country: CountryCallingCode, localNumber: string): string {
  let digits = localNumber.replace(/\D/g, "");
  if (!digits) return "";

  // Si empieza con 0, removerlo
  if (digits.startsWith("0")) {
    digits = digits.replace(/^0+/, "");
  }

  // Truncar al límite estricto de dígitos del país seleccionado
  const limitedDigits = digits.slice(0, country.maxLength);

  return `${country.dialCode}${limitedDigits}`;
}
