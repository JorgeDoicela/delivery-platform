import { describe, it, expect } from "vitest";
import {
  normalizeCatalogText,
  filterProductsBySearch,
  calculateTotalCatalogProducts,
} from "./catalogFilter";
import type { MenuProductDto, MenuCategoryDto } from "@/shared/types/api";

const mockProducts: MenuProductDto[] = [
  {
    id: 1,
    name: "Pollo Asado Completo",
    description: "Pollo entero marinado con ají casero y papas fritas",
    category: "Combos",
    basePrice: 13.0,
    imageUrl: "/images/pollo.png",
    isAvailable: true,
    modifierGroups: [],
  },
  {
    id: 2,
    name: "Medio Pollo a la Brasa",
    description: "Medio pollo dorado con ensalada fresca",
    category: "Porciones",
    basePrice: 7.5,
    imageUrl: "/images/medio.png",
    isAvailable: true,
    modifierGroups: [],
  },
  {
    id: 3,
    name: "Gaseosa 2L Familiar",
    description: "Bebida refrescante bien helada",
    category: "Bebidas",
    basePrice: 1.5,
    imageUrl: "/images/gaseosa.png",
    isAvailable: true,
    modifierGroups: [],
  },
  {
    id: 4,
    name: "Combo Broaster Familiar",
    description: "Presas crujientes con papas artesanales",
    category: "Broaster",
    basePrice: 15.0,
    imageUrl: "/images/broaster.png",
    isAvailable: true,
    modifierGroups: [],
  },
];

describe("catalogFilter helper", () => {
  it("normalizeCatalogText should remove accents and lowercase text", () => {
    expect(normalizeCatalogText("Pollo con Ají y Porción")).toBe("pollo con aji y porcion");
    expect(normalizeCatalogText("   Bebidas FRÍAS   ")).toBe("bebidas frias");
  });

  it("filterProductsBySearch should return all products when query is empty", () => {
    const result = filterProductsBySearch(mockProducts, "");
    expect(result).toHaveLength(4);
  });

  it("filterProductsBySearch should find products by name ignoring accents", () => {
    const result = filterProductsBySearch(mockProducts, "aji");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Pollo Asado Completo");
  });

  it("filterProductsBySearch should find products by category", () => {
    const result = filterProductsBySearch(mockProducts, "broaster");
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe("Broaster");
  });

  it("filterProductsBySearch should return empty array when no matches found", () => {
    const result = filterProductsBySearch(mockProducts, "hamburguesa triple");
    expect(result).toHaveLength(0);
  });

  it("calculateTotalCatalogProducts should sum products across categories", () => {
    const mockCategories: MenuCategoryDto[] = [
      { id: 1, categoryName: "Combos", displayOrder: 1, products: [mockProducts[0]] },
      { id: 2, categoryName: "Porciones", displayOrder: 2, products: [mockProducts[1]] },
      { id: 3, categoryName: "Bebidas", displayOrder: 3, products: [mockProducts[2], mockProducts[3]] },
    ];

    expect(calculateTotalCatalogProducts(mockCategories)).toBe(4);
  });
});

