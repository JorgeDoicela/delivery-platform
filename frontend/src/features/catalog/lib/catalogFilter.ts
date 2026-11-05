import type { MenuProductDto, MenuCategoryDto } from "@/shared/types/api";

/**
 * Normaliza una cadena removiendo acentos y convirtiendo a minúsculas
 */
export function normalizeCatalogText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Filtra productos por término de búsqueda comparando con nombre, descripción o categoría
 */
export function filterProductsBySearch(
  products: MenuProductDto[],
  query: string
): MenuProductDto[] {
  if (!query || !query.trim()) {
    return products;
  }

  const normalizedQuery = normalizeCatalogText(query);

  return products.filter((product) => {
    const name = normalizeCatalogText(product.name);
    const desc = normalizeCatalogText(product.description || "");
    const cat = normalizeCatalogText(product.category || "");

    return (
      name.includes(normalizedQuery) ||
      desc.includes(normalizedQuery) ||
      cat.includes(normalizedQuery)
    );
  });
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

    if (p.modifierGroups && p.modifierGroups.length > 0) {
      score += 5;
    }

    if (p.basePrice >= 4.0) {
      score += 5;
    }

    return { product: p, score };
  });

  scored.sort(
    (a, b) => b.score - a.score || b.product.basePrice - a.product.basePrice
  );

  return scored.slice(0, limit).map((s) => s.product);
}

