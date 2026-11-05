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

