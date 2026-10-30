import { create } from "zustand";
import {
  DEFAULT_TENANT_SLUG,
  getApiClientTenantSlug,
  setApiClientTenantSlug,
} from "@/shared/lib/api-client";
import type {
  PublicTenantSummaryDto,
  TenantStorefrontConfigDto,
} from "@/shared/types/api";

export const FALLBACK_TENANT_CONFIGS: Record<string, TenantStorefrontConfigDto> = {
  "la-granjita": {
    id: "00000000-0000-0000-0000-000000000001",
    slug: "la-granjita",
    name: "La Granjita Asadero",
    tagline: "Asadero & Leña",
    description:
      "Pollo asado artesanalmente al carbón vegetal y leña seleccionada en La Granjita Asadero. Pedidos directos sin intermediarios.",
    heroSubtitle:
      "Personaliza tu orden con guarniciones calientes, ensalada fresca y ají artesanal",
    businessName: "Asadero La Granjita Cia. Ltda.",
    taxId: "1754455341001",
    logoUrl: "/images/identidad/logo.png",
    brandPrimaryColor: "#E4002B",
    brandPrimaryHoverColor: "#C40024",
    brandAccentColor: "#F59E0B",
    contactPhone: "0987654321",
    contactEmail: "pedidos@lagranjita.com",
    currencyCode: "USD",
    baseDeliveryFee: 1.5,
    enableDelivery: true,
    enableTakeout: true,
    enableDineIn: true,
    acceptsCash: true,
    acceptsBankTransfer: true,
    acceptsCard: false,
    quickLinksEnabled: true,
    landingLayoutTemplate: "asadero-clasico",
    bankDetails: {
      bankName: "Banco Pichincha",
      accountType: "Cuenta Corriente",
      accountNumber: "2100456789",
      accountHolder: "Asadero La Granjita Cia. Ltda.",
      taxId: "1754455341001",
    },
    heroSlides: [
      {
        id: "slide-granjita-1",
        badge: "Especial del Asador",
        title: "LO QUE TE FALTA ES BRASA Y LEÑA",
        subtitle:
          "Pollo entero asado lentamente al carbón vegetal con guarniciones calientes, ensalada fresca y ají artesanal.",
        ctaText: "ORDENA AQUÍ",
        ctaHref: "/catalogo",
        imageUrl: "/images/banners/hero-pollo-brasa.jpg",
        displayOrder: 1,
        isActive: true,
      },
      {
        id: "slide-granjita-2",
        badge: "Ahorro Familiar",
        title: "SUPER COMBO ASADOR 12 PRESAS",
        subtitle:
          "Rinde para 5 a 6 personas. Incluye porción doble de papas fritas rústicas, ensalada grande y gaseosa familiar.",
        ctaText: "ORDENA AQUÍ",
        ctaHref: "/catalogo",
        imageUrl: "/images/banners/hero-combo-familiar.jpg",
        displayOrder: 2,
        isActive: true,
      },
      {
        id: "slide-granjita-3",
        badge: "Favorito del Almuerzo",
        title: "COMBO CUARTO DE POLLO CLÁSICO",
        subtitle:
          "Presa dorada y jugosa con papas fritas rústicas artesanales, ensalada fresca, ají criollo y bebida personal.",
        ctaText: "ORDENA AQUÍ",
        ctaHref: "/catalogo",
        imageUrl: "/images/banners/hero-combo-personal.jpg",
        displayOrder: 3,
        isActive: true,
      },
    ],
    promotionalBanners: [
      {
        id: "promo-granjita-1",
        title: "24 Horas de Marinado a Fuego Lento",
        subtitle:
          "Nuestra receta tradicional combina especias frescas, ajo asado y limón con cocción lenta sobre leña y carbón vegetal.",
        ctaText: "Conoce Más",
        ctaHref: "/catalogo",
        imageUrl: "/images/banners/promo-receta-tradicional.jpg",
        themeVariant: "slate",
        displayOrder: 1,
        isActive: true,
      },
      {
        id: "promo-granjita-2",
        title: "HECHO A LA BRASA",
        subtitle:
          "Cada pollo se asa al momento en nuestros hornos ecológicos de alta temperatura para garantizar piel crujiente y carne jugosa.",
        ctaText: "Ver Combos",
        ctaHref: "/catalogo",
        imageUrl: "/images/banners/promo-hecho-a-la-brasa.jpg",
        themeVariant: "dark",
        displayOrder: 2,
        isActive: true,
      },
    ],
    branches: [
      {
        id: 1,
        name: "Sucursal #1 (Norte)",
        address: "Av. Amazonas y República (Edif. Sky)",
        phone: "0987654321",
        openingTime: "10:30",
        closingTime: "21:30",
        maxOrdersPerSlot: 15,
        latitude: -0.1782,
        longitude: -78.4845,
        isActive: true,
      },
      {
        id: 2,
        name: "Sucursal #2 (Sur)",
        address: "Av. Rodrigo de Chávez y Maldonado",
        phone: "0987654322",
        openingTime: "10:30",
        closingTime: "21:30",
        maxOrdersPerSlot: 15,
        latitude: -0.23,
        longitude: -78.518,
        isActive: true,
      },
    ],
  },
  "brasas-del-valle": {
    id: "00000000-0000-0000-0000-000000000002",
    slug: "brasas-del-valle",
    name: "Brasas del Valle",
    tagline: "Parrilla & Cortes Madurados",
    description:
      "Cortes Angus importados, bife de chorizo y parrilladas familiares asadas sobre quebracho colorado y carbón vegetal.",
    heroSubtitle:
      "Selecciona el término de cocción exacto, chimichurri argentino artesanal y guarniciones a la parrilla",
    businessName: "Gastronomía Brasas del Valle S.A.S.",
    taxId: "1793100200001",
    logoUrl: "/images/identidad/logo.png",
    brandPrimaryColor: "#047857",
    brandPrimaryHoverColor: "#065F46",
    brandAccentColor: "#D97706",
    contactPhone: "0998887766",
    contactEmail: "pedidos@brasasdelvalle.com",
    currencyCode: "USD",
    baseDeliveryFee: 2.0,
    enableDelivery: true,
    enableTakeout: true,
    enableDineIn: true,
    acceptsCash: true,
    acceptsBankTransfer: true,
    acceptsCard: true,
    quickLinksEnabled: true,
    landingLayoutTemplate: "steakhouse-gourmet",
    bankDetails: {
      bankName: "Banco Guayaquil",
      accountType: "Cuenta Corriente",
      accountNumber: "0045891230",
      accountHolder: "Gastronomía Brasas del Valle S.A.S.",
      taxId: "1793100200001",
    },
    heroSlides: [
      {
        id: "slide-brasas-1",
        badge: "Cortes Premium a la Parrilla",
        title: "PARRILLADA IMPERIAL AL QUEBRACHO",
        subtitle:
          "Bife de chorizo, lomo fino, chuleta ahumada, chorizo argentino, morcilla y papas al romero para 4 personas.",
        ctaText: "PEDIR PARRILLADA",
        ctaHref: "/catalogo",
        imageUrl: "/images/banners/hero-combo-familiar.jpg",
        displayOrder: 1,
        isActive: true,
      },
      {
        id: "slide-brasas-2",
        badge: "Maduración 28 Días",
        title: "BIFE DE CHORIZO ANGUS 400G",
        subtitle:
          "Sellado a fuego vivo con sal en escamas, mantequilla de ajo asado, ensalada tibia y papas rústicas.",
        ctaText: "VER CORTES",
        ctaHref: "/catalogo",
        imageUrl: "/images/banners/hero-pollo-brasa.jpg",
        displayOrder: 2,
        isActive: true,
      },
    ],
    promotionalBanners: [
      {
        id: "promo-brasas-1",
        title: "Maduración en Cámara Propia",
        subtitle:
          "Controlamos humedad y temperatura durante 28 días para lograr terneza superior y sabor concentrado en cada corte.",
        ctaText: "Explorar Carta",
        ctaHref: "/catalogo",
        imageUrl: "/images/banners/promo-hecho-a-la-brasa.jpg",
        themeVariant: "dark",
        displayOrder: 1,
        isActive: true,
      },
      {
        id: "promo-brasas-2",
        title: "Chimichurri & Salsas de Autor",
        subtitle:
          "Elaboradas diariamente con perejil fresco de huerto, orégano andino, ajo confitado y aceite de oliva extra virgen.",
        ctaText: "Ordenar Ahora",
        ctaHref: "/catalogo",
        imageUrl: "/images/banners/promo-receta-tradicional.jpg",
        themeVariant: "slate",
        displayOrder: 2,
        isActive: true,
      },
    ],
    branches: [
      {
        id: 3,
        name: "Matriz Cumbayá & Quito Norte",
        address: "Av. Interoceánica y Paseo de los Chícaros",
        phone: "0998887766",
        openingTime: "11:00",
        closingTime: "22:30",
        maxOrdersPerSlot: 18,
        latitude: -0.1782,
        longitude: -78.4845,
        isActive: true,
      },
    ],
  },
};

export const FALLBACK_PUBLIC_TENANTS: PublicTenantSummaryDto[] = Object.values(
  FALLBACK_TENANT_CONFIGS
).map((cfg) => ({
  id: cfg.id,
  slug: cfg.slug,
  name: cfg.name,
  tagline: cfg.tagline,
  description: cfg.description,
  logoUrl: cfg.logoUrl,
  brandPrimaryColor: cfg.brandPrimaryColor,
  brandPrimaryHoverColor: cfg.brandPrimaryHoverColor,
  brandAccentColor: cfg.brandAccentColor,
  baseDeliveryFee: cfg.baseDeliveryFee,
  activeBranchesCount: cfg.branches.length,
  primaryBranchAddress: cfg.branches[0]?.address ?? "Matriz Principal",
}));

export function getFallbackTenantConfig(slug: string): TenantStorefrontConfigDto {
  return FALLBACK_TENANT_CONFIGS[slug] ?? FALLBACK_TENANT_CONFIGS[DEFAULT_TENANT_SLUG];
}

interface TenantStoreState {
  tenantSlug: string;
  setTenantSlug: (slug: string) => void;
  hydrateTenantSlug: () => void;
}

export const useTenantStore = create<TenantStoreState>((set) => ({
  tenantSlug: DEFAULT_TENANT_SLUG,
  setTenantSlug: (slug: string) => {
    const normalized = slug.trim().toLowerCase();
    if (!normalized) return;
    setApiClientTenantSlug(normalized);
    set({ tenantSlug: normalized });
  },
  hydrateTenantSlug: () => {
    const resolved = getApiClientTenantSlug();
    set({ tenantSlug: resolved });
  },
}));

