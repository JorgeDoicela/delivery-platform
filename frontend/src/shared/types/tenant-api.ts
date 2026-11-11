// Contratos Multi-Tenant & Personalización de Storefront

export interface TenantHeroSlide {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaHref: string;
  imageUrl: string;
  displayOrder: number;
  isActive: boolean;
}

export interface TenantPromoBanner {
  id: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaHref: string;
  imageUrl: string;
  themeVariant: "dark" | "slate" | "brand";
  displayOrder: number;
  isActive: boolean;
}

export interface TenantBankDetailsDto {
  bankName: string;
  accountType: string;
  accountNumber: string;
  accountHolder: string;
  taxId: string;
}

export interface TenantBranchSummaryDto {
  id: number;
  name: string;
  address: string;
  phone: string;
  openingTime: string;
  closingTime: string;
  maxOrdersPerSlot: number;
  latitude: number;
  longitude: number;
  isActive: boolean;
  deliveryRadiusKm?: number | null;
  isCoverageStrict?: boolean;
}

export interface BranchDetailDto {
  id: number;
  name: string;
  address: string;
  phone: string;
  openingTime: string;
  closingTime: string;
  maxOrdersPerSlot: number;
  sriEstablishmentCode: string;
  sriEmissionPoint: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  deliveryRadiusKm?: number | null;
  isCoverageStrict?: boolean;
}

export interface UpdateBranchHoursRequest {
  openingTime: string;
  closingTime: string;
  isActive?: boolean;
  deliveryRadiusKm?: number | null;
  isCoverageStrict?: boolean;
}

export interface UpdateBranchHoursResponse {
  branchId: number;
  name: string;
  openingTime: string;
  closingTime: string;
  isActive: boolean;
  deliveryRadiusKm?: number | null;
  isCoverageStrict?: boolean;
}

export interface PublicTenantSummaryDto {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  logoUrl: string;
  brandPrimaryColor: string;
  brandPrimaryHoverColor: string;
  brandAccentColor: string;
  baseDeliveryFee: number;
  customDomain?: string | null;
  activeBranchesCount: number;
  primaryBranchAddress: string;
}

export interface PublicTenantsResponse {
  tenants: PublicTenantSummaryDto[];
}

export interface TenantStorefrontConfigDto {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  heroSubtitle: string;
  businessName: string;
  taxId: string;
  logoUrl: string;
  brandPrimaryColor: string;
  brandPrimaryHoverColor: string;
  brandAccentColor: string;
  contactPhone: string;
  contactEmail: string;
  currencyCode: string;
  baseDeliveryFee: number;
  enableDelivery: boolean;
  enableTakeout: boolean;
  enableDineIn: boolean;
  acceptsCash: boolean;
  acceptsBankTransfer: boolean;
  acceptsCard: boolean;
  quickLinksEnabled: boolean;
  landingLayoutTemplate?: string;
  customDomain?: string | null;
  termsAndConditionsMarkdown?: string | null;
  privacyPolicyMarkdown?: string | null;
  bankDetails: TenantBankDetailsDto;
  heroSlides: TenantHeroSlide[];
  promotionalBanners: TenantPromoBanner[];
  branches: TenantBranchSummaryDto[];
  requireCoverageValidation?: boolean;
}

export interface UpdateTenantStorefrontCommand {
  name: string;
  tagline: string;
  description: string;
  heroSubtitle: string;
  businessName: string;
  taxId: string;
  logoUrl: string;
  brandPrimaryColor: string;
  brandPrimaryHoverColor: string;
  brandAccentColor: string;
  contactPhone: string;
  contactEmail: string;
  baseDeliveryFee: number;
  enableDelivery: boolean;
  enableTakeout: boolean;
  enableDineIn: boolean;
  acceptsCash: boolean;
  acceptsBankTransfer: boolean;
  acceptsCard: boolean;
  quickLinksEnabled: boolean;
  landingLayoutTemplate?: string;
  customDomain?: string | null;
  termsAndConditionsMarkdown?: string | null;
  privacyPolicyMarkdown?: string | null;
  bankDetails: TenantBankDetailsDto;
  heroSlides: TenantHeroSlide[];
  promotionalBanners: TenantPromoBanner[];
  requireCoverageValidation?: boolean;
}

export interface PlatformTenantItemDto {
  id: string;
  slug: string;
  name: string;
  businessName: string;
  taxId: string;
  tagline: string;
  description: string;
  logoUrl: string;
  brandPrimaryColor: string;
  brandPrimaryHoverColor: string;
  brandAccentColor: string;
  contactPhone: string;
  contactEmail: string;
  baseDeliveryFee: number;
  customDomain?: string | null;
  isActive: boolean;
  branchesCount: number;
  productsCount: number;
  adminEmail: string;
  primaryBranchAddress: string;
  createdAt: string;
}

export interface PlatformTenantsResponse {
  tenants: PlatformTenantItemDto[];
}

export interface CreateTenantCommand {
  name: string;
  slug: string;
  businessName: string;
  taxId: string;
  tagline: string;
  description: string;
  brandPrimaryColor: string;
  brandPrimaryHoverColor: string;
  brandAccentColor: string;
  baseDeliveryFee: number;
  contactPhone: string;
  contactEmail: string;
  primaryBranchName: string;
  primaryBranchAddress: string;
  adminFullName: string;
  adminEmail: string;
  adminPassword: string;
  logoUrl?: string;
  landingLayoutTemplate?: string;
  heroBannerImageUrl?: string;
  customDomain?: string;
}

export interface CreatedTenantDto {
  id: string;
  slug: string;
  name: string;
  businessName: string;
  taxId: string;
  brandPrimaryColor: string;
  isActive: boolean;
  adminEmail: string;
  primaryBranchId: number;
}

export interface ToggleTenantStatusResponse {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
}

export interface UpsertProductCommand {
  productId?: number | null;
  name: string;
  description: string;
  basePrice: number;
  category: string;
  imageUrl: string;
  isActive: boolean;
}

export interface UpsertProductResponse {
  id: number;
  name: string;
  description: string;
  basePrice: number;
  category: string;
  imageUrl: string;
  isActive: boolean;
}

