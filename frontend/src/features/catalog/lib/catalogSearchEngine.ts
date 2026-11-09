import type { MenuProductDto } from "@/shared/types/api";

/**
 * Normaliza texto eliminando acentos, caracteres diacríticos, puntuación y espacios redundantes.
 */
export function normalizeSearchText(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remueve diacríticos / tildes
    .replace(/[^\w\s/]/g, " ")       // Reemplaza puntuación por espacios, preservando '/' para fracciones (ej. 1/4)
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Mapeo de términos culinarios comunes con variantes fonéticas y abreviaturas frecuentes.
 */
const CULINARY_SYNONYMS: Record<string, string> = {
  broster: "broaster",
  brost: "broaster",
  cebiche: "ceviche",
  seviche: "ceviche",
  sanduche: "sandwich",
  sanguch: "sandwich",
  sanguche: "sandwich",
  hamburgesa: "hamburguesa",
  hamburgueza: "hamburguesa",
  cocacola: "coca cola",
  coke: "coca cola",
  pepsi: "gaseosa pepsi",
  fanta: "gaseosa fanta",
  sprite: "gaseosa sprite",
  poyo: "pollo",
  churasco: "churrasco",
  costiya: "costilla",
  parila: "parrilla",
  arros: "arroz",
  conbo: "combo",
};

/**
 * Stemmer ligero para español: normaliza plurales gastronómicos a singular.
 * Ejemplo: "alitas" -> "alita", "papas" -> "papa", "carnes" -> "carne", "porciones" -> "porcion".
 */
export function stemSpanishWord(word: string): string {
  if (word.length <= 3) return word;

  // Variantes con "ces" -> "z" (ej. "luces" -> "luz")
  if (word.endsWith("ces") && word.length > 4) {
    return word.slice(0, -3) + "z";
  }

  // Palabras terminadas en "iones" (ej. "porciones" -> "porcion", "guarniciones" -> "guarnicion")
  if (word.endsWith("iones") && word.length > 5) {
    return word.slice(0, -2);
  }

  // En español, la inmensa mayoría de sustantivos culinarios forman el plural agregando 's'
  // (ej. "papas" -> "papa", "alitas" -> "alita", "bebidas" -> "bebida", "carnes" -> "carne", "postres" -> "postre")
  if (word.endsWith("s") && !word.endsWith("ss") && word.length > 3) {
    const prevChar = word.charAt(word.length - 2);
    if ("aeiou".includes(prevChar)) {
      return word.slice(0, -1);
    }
  }

  return word;
}

/**
 * Distancia de Levenshtein con optimización de memoria (O(min(N, M))) para fuzzy matching ultrarrápido.
 */
export function calculateLevenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  // Asegura que 'b' sea la cadena más corta para minimizar uso de memoria
  if (a.length < b.length) {
    const temp = a;
    a = b;
    b = temp;
  }

  const bLen = b.length;
  let prevRow = new Int32Array(bLen + 1);
  let currRow = new Int32Array(bLen + 1);

  for (let j = 0; j <= bLen; j++) {
    prevRow[j] = j;
  }

  for (let i = 1; i <= a.length; i++) {
    currRow[0] = i;
    const charA = a.charCodeAt(i - 1);

    for (let j = 1; j <= bLen; j++) {
      const charB = b.charCodeAt(j - 1);
      const cost = charA === charB ? 0 : 1;

      currRow[j] = Math.min(
        currRow[j - 1] + 1,      // Inserción
        prevRow[j] + 1,          // Eliminación
        prevRow[j - 1] + cost    // Sustitución
      );
    }

    // Intercambia filas
    const swap = prevRow;
    prevRow = currRow;
    currRow = swap;
  }

  return prevRow[bLen];
}

/**
 * Evalúa si dos tokens coinciden de forma exacta, por prefijo o difusa (typo tolerance).
 * Devuelve un score de coincidencia (0 si no coincide).
 */
function evaluateTokenMatch(queryToken: string, targetToken: string): number {
  if (queryToken === targetToken) {
    return 1.0; // Coincidencia exacta
  }

  // Coincidencia con stemming
  const stemmedQuery = stemSpanishWord(queryToken);
  const stemmedTarget = stemSpanishWord(targetToken);
  if (stemmedQuery === stemmedTarget) {
    return 0.95;
  }

  // Prefijo (el usuario aún está escribiendo, ej: "hamb" -> "hamburguesa")
  if (targetToken.startsWith(queryToken) && queryToken.length >= 3) {
    return 0.85;
  }

  // Tolerancia a errores tipográficos según longitud del token
  const queryLen = queryToken.length;
  if (queryLen < 4) {
    // Para palabras de 1 a 3 letras (ej. "te", "pan", "1/4"), no permitimos errores tipográficos
    return 0;
  }

  const maxAllowedDistance = queryLen <= 6 ? 1 : 2;
  const distance = calculateLevenshteinDistance(queryToken, targetToken);

  if (distance <= maxAllowedDistance) {
    // Puntuación proporcional a la cercanía
    return 0.7 - distance * 0.15;
  }

  return 0;
}

/**
 * Extrae y normaliza los modificadores e ingredientes de un producto para indexación.
 */
function extractModifierKeywords(product: MenuProductDto): string[] {
  if (!product.modifierGroups || product.modifierGroups.length === 0) return [];
  const keywords: string[] = [];
  for (const group of product.modifierGroups) {
    if (group.name) keywords.push(normalizeSearchText(group.name));
    if (group.options) {
      for (const opt of group.options) {
        if (opt.name) keywords.push(normalizeSearchText(opt.name));
      }
    }
  }
  return keywords;
}

export interface SearchResultItem {
  product: MenuProductDto;
  score: number;
}

/**
 * Algoritmo profesional de búsqueda gastronómica en memoria:
 * - Tolerancia a fallos tipográficos (Levenshtein adaptativo).
 * - Búsqueda multi-token con ponderación por campos (nombre > categoría > modificadores > descripción).
 * - Stemming singular/plural culinario en español.
 * - Soporte para sinónimos gastronómicos comunes.
 * - Rendimiento sub-milisegundo con cero dependencias pesadas de terceros.
 */
export function searchCatalogProducts(
  products: MenuProductDto[],
  rawQuery: string
): MenuProductDto[] {
  if (!products || products.length === 0) return [];
  if (!rawQuery || !rawQuery.trim()) return products;

  // 1. Normalización y expansión de la consulta
  let cleanQuery = normalizeSearchText(rawQuery);
  if (!cleanQuery) return products;

  // Reemplazo de sinónimos directos en la consulta
  for (const [key, replacement] of Object.entries(CULINARY_SYNONYMS)) {
    if (cleanQuery === key || cleanQuery.startsWith(key + " ") || cleanQuery.endsWith(" " + key)) {
      cleanQuery = cleanQuery.replace(new RegExp(`\\b${key}\\b`, "g"), replacement);
    }
  }

  const queryTokens = cleanQuery.split(/\s+/).filter(Boolean);
  if (queryTokens.length === 0) return products;

  const results: SearchResultItem[] = [];

  for (const product of products) {
    const normName = normalizeSearchText(product.name);
    const normDesc = normalizeSearchText(product.description || "");
    const normCat = normalizeSearchText(product.category || "");
    const modKeywords = extractModifierKeywords(product);

    let score = 0;

    // A. Bonificación por Coincidencia Exacta de la Frase Completa
    if (normName === cleanQuery) {
      score += 250;
    } else if (normName.startsWith(cleanQuery)) {
      score += 120;
    } else if (normName.includes(cleanQuery)) {
      score += 80;
    }

    if (normCat.includes(cleanQuery)) {
      score += 60;
    }

    if (normDesc.includes(cleanQuery)) {
      score += 30;
    }

    // B. Evaluación Multi-Token (cada palabra de la búsqueda aporta valor)
    const nameWords = normName.split(/\s+/);
    const catWords = normCat.split(/\s+/);
    const descWords = normDesc.split(/\s+/);

    let matchedTokensCount = 0;

    for (const qToken of queryTokens) {
      let bestTokenScore = 0;

      // 1. Coincidencia en Nombre (peso x40)
      for (const w of nameWords) {
        const match = evaluateTokenMatch(qToken, w);
        if (match > bestTokenScore) {
          bestTokenScore = match * 40;
        }
      }

      // 2. Coincidencia en Categoría (peso x30)
      for (const w of catWords) {
        const match = evaluateTokenMatch(qToken, w);
        const catScore = match * 30;
        if (catScore > bestTokenScore) {
          bestTokenScore = catScore;
        }
      }

      // 3. Coincidencia en Modificadores / Opciones (peso x20)
      for (const mod of modKeywords) {
        const modWords = mod.split(/\s+/);
        for (const mw of modWords) {
          const match = evaluateTokenMatch(qToken, mw);
          const modScore = match * 20;
          if (modScore > bestTokenScore) {
            bestTokenScore = modScore;
          }
        }
      }

      // 4. Coincidencia en Descripción (peso x15)
      for (const w of descWords) {
        const match = evaluateTokenMatch(qToken, w);
        const descScore = match * 15;
        if (descScore > bestTokenScore) {
          bestTokenScore = descScore;
        }
      }

      if (bestTokenScore > 0) {
        matchedTokensCount++;
        score += bestTokenScore;
      }
    }

    // C. Bonificación especial si coinciden TODOS los tokens de la búsqueda
    if (matchedTokensCount === queryTokens.length) {
      score += 50;
    }

    // D. Umbral mínimo de relevancia: al menos un token debe haber coincidido
    if (score > 0 && matchedTokensCount > 0) {
      results.push({ product, score });
    }
  }

  // Ordenar por score descendente (mayor relevancia primero)
  results.sort((a, b) => b.score - a.score);

  return results.map((r) => r.product);
}
