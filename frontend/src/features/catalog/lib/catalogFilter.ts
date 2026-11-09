import type { MenuProductDto, MenuCategoryDto } from "@/shared/types/api";
import { searchCatalogProducts, normalizeSearchText } from "./catalogSearchEngine";

export { searchCatalogProducts, normalizeSearchText };

/**
 * Normaliza una cadena removiendo acentos y convirtiendo a minúsculas
 */
export function normalizeCatalogText(text: string): string {
  return normalizeSearchText(text);
}

/**
 * Filtra productos por término de búsqueda utilizando el algoritmo profesional de búsqueda gastronómica:
 * - Tolerancia a fallos tipográficos (Damerau-Levenshtein)
 * - Multi-token scoring y ponderación jerárquica
 * - Stemming en español y sinónimos gastronómicos
 * - Búsqueda en nombre, categoría, modificadores y descripción
 */
export function filterProductsBySearch(
  products: MenuProductDto[],
  query: string
): MenuProductDto[] {
  return searchCatalogProducts(products, query);
}

/**
 * Calcula la suma total de productos en un catálogo
 */
export function calculateTotalCatalogProducts(
  categories: MenuCategoryDto[]
): number {
  return categories.reduce((acc, cat) => acc + cat.products.length, 0);
}

/**
 * Palabras clave de categorías secundarias que se omiten en el escaparate de "Más Vendidos"
 */
const SECONDARY_CATEGORY_KEYWORDS = [
  "bebida",
  "extra",
  "guarnicion",
  "adicional",
  "salsa",
];

/**
 * Extrae y pondera los productos más populares y representativos para el escaparate de la Landing
 */
export function getPopularProducts(
  categories: MenuCategoryDto[],
  limit: number = 6
): MenuProductDto[] {
  if (!categories || categories.length === 0) return [];

  // 1. Priorizar categorías principales (platos fuertes, combos, porciones y especialidades)
  const mainCategories = categories.filter((cat) => {
    const norm = normalizeCatalogText(cat.categoryName);
    return !SECONDARY_CATEGORY_KEYWORDS.some((kw) => norm.includes(kw));
  });

  const categoriesToUse =
    mainCategories.length > 0 ? mainCategories : categories;

  const candidates = categoriesToUse.flatMap((c) => c.products);

  // 2. Ponderación por palabras clave de platos estrella gastronómicos
  const FLAGSHIP_KEYWORDS = [
    "familiar",
    "completo",
    "promo",
    "2x1",
    "banquete",
    "1/4",
    "medio",
    "asado",
    "broaster",
    "combo",
  ];

  const scored = candidates.map((p) => {
    const normName = normalizeCatalogText(p.name);
    let score = 0;

    FLAGSHIP_KEYWORDS.forEach((kw, index) => {
      if (normName.includes(kw)) {
        score += (FLAGSHIP_KEYWORDS.length - index) * 10;
      }
    });

    return { product: p, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.product);
}
