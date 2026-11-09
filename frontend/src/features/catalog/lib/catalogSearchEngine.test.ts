import { describe, it, expect } from "vitest";
import {
  searchCatalogProducts,
  calculateLevenshteinDistance,
  stemSpanishWord,
  normalizeSearchText,
} from "./catalogSearchEngine";
import type { MenuProductDto } from "@/shared/types/api";

const mockMenu: MenuProductDto[] = [
  {
    id: 1,
    name: "Pollo Asado Completo",
    description: "Pollo marinado al carbón con ají casero y papas fritas",
    category: "Pollos y Medios",
    basePrice: 14.5,
    imageUrl: "/images/pollo.png",
    isActive: true,
    modifierGroups: [
      {
        id: 101,
        name: "Guarnición",
        minSelectable: 1,
        maxSelectable: 1,
        isRequired: true,
        options: [
          { id: 1001, name: "Papas Fritas Grandes", additionalPrice: 0, isAvailable: true },
          { id: 1002, name: "Arroz con Menestra", additionalPrice: 0.5, isAvailable: true },
        ],
      },
    ],
  },
  {
    id: 2,
    name: "Combo Broaster Familiar",
    description: "8 presas crujientes con ensalada de col y gaseosa 1.5L",
    category: "Combos",
    basePrice: 19.99,
    imageUrl: "/images/broaster.png",
    isActive: true,
    modifierGroups: [],
  },
  {
    id: 3,
    name: "Alitas Picantes BBQ",
    description: "12 alitas glaseadas en salsa barbacoa con apio",
    category: "Piques",
    basePrice: 8.5,
    imageUrl: "/images/alitas.png",
    isActive: true,
    modifierGroups: [],
  },
  {
    id: 4,
    name: "Hamburguesa Doble Carne",
    description: "Carne artesanal con queso cheddar, tocino y papas",
    category: "Hamburguesas",
    basePrice: 6.0,
    imageUrl: "/images/burger.png",
    isActive: true,
    modifierGroups: [],
  },
  {
    id: 5,
    name: "Gaseosa Coca-Cola 2L",
    description: "Bebida gaseosa helada para compartir",
    category: "Bebidas",
    basePrice: 2.5,
    imageUrl: "/images/coca.png",
    isActive: true,
    modifierGroups: [],
  },
];

describe("catalogSearchEngine", () => {
  describe("normalizeSearchText", () => {
    it("debe remover acentos, diacríticos y normalizar a minúsculas", () => {
      expect(normalizeSearchText("Pollo al Carbón & Ají Criollo!")).toBe("pollo al carbon aji criollo");
      expect(normalizeSearchText("  1/4  DE   POLLO   ")).toBe("1/4 de pollo");
    });
  });

  describe("stemSpanishWord", () => {
    it("debe normalizar plurales gastronómicos a singular", () => {
      expect(stemSpanishWord("alitas")).toBe("alita");
      expect(stemSpanishWord("papas")).toBe("papa");
      expect(stemSpanishWord("bebidas")).toBe("bebida");
      expect(stemSpanishWord("porciones")).toBe("porcion");
      expect(stemSpanishWord("carnes")).toBe("carne");
    });

    it("no debe recortar palabras cortas", () => {
      expect(stemSpanishWord("pan")).toBe("pan");
      expect(stemSpanishWord("te")).toBe("te");
      expect(stemSpanishWord("dos")).toBe("dos");
    });
  });

  describe("calculateLevenshteinDistance", () => {
    it("debe calcular distancias exactas con mínimo uso de memoria", () => {
      expect(calculateLevenshteinDistance("pollo", "pollo")).toBe(0);
      expect(calculateLevenshteinDistance("polo", "pollo")).toBe(1);
      expect(calculateLevenshteinDistance("broster", "broaster")).toBe(1);
      expect(calculateLevenshteinDistance("hamburgesa", "hamburguesa")).toBe(1);
    });
  });

  describe("searchCatalogProducts", () => {
    it("debe devolver todos los productos si la búsqueda está vacía", () => {
      expect(searchCatalogProducts(mockMenu, "")).toHaveLength(5);
      expect(searchCatalogProducts(mockMenu, "   ")).toHaveLength(5);
    });

    it("debe encontrar productos con tolerancia a errores tipográficos (Fuzzy Matching)", () => {
      // "broster" debe encontrar "Combo Broaster Familiar"
      const resBroaster = searchCatalogProducts(mockMenu, "broster");
      expect(resBroaster.length).toBeGreaterThan(0);
      expect(resBroaster[0].name).toBe("Combo Broaster Familiar");

      // "hamburgesa" debe encontrar "Hamburguesa Doble Carne"
      const resBurger = searchCatalogProducts(mockMenu, "hamburgesa");
      expect(resBurger.length).toBeGreaterThan(0);
      expect(resBurger[0].name).toBe("Hamburguesa Doble Carne");
    });

    it("debe encontrar productos en singular cuando el usuario busca en plural y viceversa (Stemming)", () => {
      // Usuario busca "alita" (singular) y el menú dice "Alitas Picantes BBQ"
      const resSingular = searchCatalogProducts(mockMenu, "alita");
      expect(resSingular.some((p) => p.name === "Alitas Picantes BBQ")).toBe(true);

      // Usuario busca "alitas" (plural)
      const resPlural = searchCatalogProducts(mockMenu, "alitas");
      expect(resPlural.some((p) => p.name === "Alitas Picantes BBQ")).toBe(true);
    });

    it("debe soportar búsquedas multi-token separadas (ej. 'pollo papas')", () => {
      const res = searchCatalogProducts(mockMenu, "pollo papas");
      expect(res.length).toBeGreaterThan(0);
      // El pollo asado tiene papas en la descripción y guarniciones
      expect(res[0].name).toBe("Pollo Asado Completo");
    });

    it("debe buscar dentro de los modificadores e ingredientes del producto", () => {
      // El modificador tiene "Arroz con Menestra"
      const res = searchCatalogProducts(mockMenu, "menestra");
      expect(res.length).toBeGreaterThan(0);
      expect(res[0].name).toBe("Pollo Asado Completo");
    });

    it("debe priorizar coincidencias exactas por encima de difusas", () => {
      const res = searchCatalogProducts(mockMenu, "Pollo Asado Completo");
      expect(res[0].name).toBe("Pollo Asado Completo");
    });

    it("debe resolver sinónimos comunes gastronómicos (ej. 'coke' o 'cocacola')", () => {
      const res = searchCatalogProducts(mockMenu, "cocacola");
      expect(res.length).toBeGreaterThan(0);
      expect(res[0].name).toBe("Gaseosa Coca-Cola 2L");
    });

    it("debe retornar arreglo vacío ante búsquedas sin coincidencia", () => {
      const res = searchCatalogProducts(mockMenu, "sushi roll tempura xyz");
      expect(res).toHaveLength(0);
    });
  });
});

