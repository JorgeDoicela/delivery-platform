import Fuse, { type IFuseOptions } from "fuse.js";
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

    const swap = prevRow;
    prevRow = currRow;
    currRow = swap;
  }

  return prevRow[bLen];
}

interface IndexedProduct {
  product: MenuProductDto;
  normName: string;
  name: string;
  normCategory: string;
  stemmedWords: string[];
  normModifiers: string[];
  normDescription: string;
}

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

/**
 * Motor de búsqueda profesional gastronómico basado en Fuse.js:
 * - Tolerancia a fallos tipográficos y coincidencias difusas (Fuzzy Search).
 * - Coincidencia instantánea por prefijo y subcadenas desde 1 o 2 letras (ej. "po" -> "Pollo").
 * - Soporte multi-token ponderado (Nombre > Categoría > Modificadores > Descripción).
 * - Normalización de acentos/diacríticos y sinónimos gastronómicos.
 * - Stemming singular/plural en español.
 */
export function searchCatalogProducts(
  products: MenuProductDto[],
  rawQuery: string
): MenuProductDto[] {
  if (!products || products.length === 0) return [];
  if (!rawQuery || !rawQuery.trim()) return products;

  let cleanQuery = normalizeSearchText(rawQuery);
  if (!cleanQuery) return products;

  // Reemplazo de sinónimos directos en la consulta
  for (const [key, replacement] of Object.entries(CULINARY_SYNONYMS)) {
    if (
      cleanQuery === key ||
      cleanQuery.startsWith(key + " ") ||
      cleanQuery.endsWith(" " + key) ||
      cleanQuery.includes(" " + key + " ")
    ) {
      cleanQuery = cleanQuery.replace(new RegExp(`\\b${key}\\b`, "g"), replacement);
    }
  }

  // Prepara documentos enriquecidos para indexación en Fuse
  const indexedList: IndexedProduct[] = products.map((product) => {
    const normName = normalizeSearchText(product.name);
    const normCat = normalizeSearchText(product.category || "");
    const normDesc = normalizeSearchText(product.description || "");
    const modKeywords = extractModifierKeywords(product);

    // Extrae palabras para normalización con stemming
    const allWords = `${normName} ${normCat} ${normDesc} ${modKeywords.join(" ")}`
      .split(/\s+/)
      .filter((w) => w.length > 2);
    const stemmedWords = Array.from(new Set(allWords.map(stemSpanishWord)));

    return {
      product,
      name: product.name,
      normName,
      normCategory: normCat,
      stemmedWords,
      normModifiers: modKeywords,
      normDescription: normDesc,
    };
  });

  const isShortQuery = cleanQuery.length <= 3;

  // 1. Coincidencias directas por subcadena (exact match en nombre, categoría, modificadores o descripción)
  const directMatches = indexedList.filter((item) => {
    return (
      item.normName.includes(cleanQuery) ||
      item.normCategory.includes(cleanQuery) ||
      item.normDescription.includes(cleanQuery) ||
      item.normModifiers.some((mod) => mod.includes(cleanQuery))
    );
  });

  // Si la consulta es corta (ej. "po", "aji", "pan"), priorizar coincidencias directas para evitar falsos positivos
  if (isShortQuery && directMatches.length > 0) {
    return directMatches
      .sort((a, b) => {
        const aStarts = a.normName.startsWith(cleanQuery);
        const bStarts = b.normName.startsWith(cleanQuery);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return a.normName.localeCompare(b.normName);
      })
      .map((item) => item.product);
  }

  const fuseOptions: IFuseOptions<IndexedProduct> = {
    keys: [
      { name: "normName", weight: 0.45 },
      { name: "name", weight: 0.25 },
      { name: "stemmedWords", weight: 0.15 },
      { name: "normCategory", weight: 0.15 },
      { name: "normModifiers", weight: 0.1 },
      { name: "normDescription", weight: 0.05 },
    ],
    threshold: isShortQuery ? 0.15 : 0.35,
    distance: 100,
    minMatchCharLength: 1,
    ignoreLocation: true,
    includeScore: true,
    shouldSort: true,
    findAllMatches: true,
  };

  const fuse = new Fuse(indexedList, fuseOptions);

  // 2. Búsqueda principal con Fuse.js
  let fuseResults = fuse.search(cleanQuery);

  // 3. Si es búsqueda multi-palabra y no arrojó resultados, prueba con tokens stemmed
  if (fuseResults.length === 0) {
    const queryTokens = cleanQuery.split(/\s+/).filter(Boolean);
    if (queryTokens.length > 0) {
      const stemmedQuery = queryTokens.map(stemSpanishWord).join(" ");
      if (stemmedQuery !== cleanQuery) {
        fuseResults = fuse.search(stemmedQuery);
      }
    }
  }

  // 4. Combinar coincidencias directas y resultados Fuse preservando el orden de relevancia
  const combinedMap = new Map<number, { product: MenuProductDto; score: number }>();

  for (const item of directMatches) {
    let score = 0.05;
    if (item.normName.startsWith(cleanQuery)) {
      score = 0.01;
    } else if (item.normName.includes(cleanQuery)) {
      score = 0.03;
    }
    combinedMap.set(item.product.id, { product: item.product, score });
  }

  for (const res of fuseResults) {
    const existing = combinedMap.get(res.item.product.id);
    const resScore = res.score ?? 0.2;
    if (!existing || resScore < existing.score) {
      combinedMap.set(res.item.product.id, { product: res.item.product, score: resScore });
    }
  }

  const results = Array.from(combinedMap.values());
  results.sort((a, b) => a.score - b.score);

  return results.map((r) => r.product);
}
