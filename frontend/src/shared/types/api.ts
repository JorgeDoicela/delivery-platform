// Tipos de Contrato sincronizados con la API .NET 8 (Delivery.Features)

export interface MenuModifierOptionDto {
  id: number;
  name: string;
  additionalPrice: number;
  isAvailable: boolean;
}

export interface MenuModifierGroupDto {
  id: number;
  name: string;
  minSelectable: number;
  maxSelectable: number;
  isRequired: boolean;
  options: MenuModifierOptionDto[];
}

export interface MenuProductDto {
  id: number;
  name: string;
  description: string;
  basePrice: number;
  imageUrl: string;
  category: string;
  isActive: boolean;
  modifierGroups: MenuModifierGroupDto[];
}

export interface MenuCategoryDto {
  categoryName: string;
  products: MenuProductDto[];
}

export interface ActiveMenuResponse {
  categories: MenuCategoryDto[];
  totalProducts: number;
}

export interface BranchCoverageDto {
  branchId: number;
  branchName: string;
  address: string;
  phone: string;
  maxOrdersPerSlot: number;
  isActive: boolean;
}

export interface CreateOrderItemRequest {
  productId: number;
  quantity: number;
  selectedModifierOptionIds?: number[];
}

export interface CreateOrderCommand {
  branchId: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  identificationType: string;
  identificationNumber: string;
  addressStreet: string;
  addressReference?: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  paymentMethod: number; // 1: CashOnDelivery, 2: BankTransfer, 3: CreditDebitCard
  deliveryType: number;  // 1: Delivery, 2: Takeout
  cashAmountPaid?: number;
  transferReceiptUrl?: string;
  items: CreateOrderItemRequest[];
}

export interface CreateOrderResponse {
  orderId: string;
  status: number;
  total: number;
  changeDue?: number;
  branchName: string;
  createdAt: string;
  estimatedDeliveryTime?: string;
  demandNotice?: string;
}

export interface BranchCapacityResponse {
  branchId: number;
  currentSlotOrders: number;
  maxOrdersPerSlot: number;
  isHighDemand: boolean;
  isSaturated: boolean;
  estimatedDeliveryTime: string;
  demandNotice?: string;
}

export interface OrderDetailModifierDto {
  id: string;
  modifierName: string;
  price: number;
}

export interface OrderDetailItemDto {
  id: string;
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  modifiers: OrderDetailModifierDto[];
}

export interface OrderDetailResponse {
  orderId: string;
  branchId: number;
  branchName: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  identificationType: string;
  identificationNumber: string;
  addressStreet: string;
  addressReference: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: number;
  paymentMethod: number;
  deliveryType: number;
  cashAmountPaid?: number;
  changeDue?: number;
  transferReceiptUrl?: string;
  createdAt: string;
  updatedAt?: string;
  items: OrderDetailItemDto[];
}

export enum OrderStatus {
  Created = 1,
  PendingValidation = 2,
  Confirmed = 3,
  InKitchen = 4,
  ReadyForDelivery = 5,
  OnTheWay = 6,
  Delivered = 7,
  Cancelled = 8
}

export enum PaymentMethod {
  Cash = 1,
  BankTransfer = 2,
  CreditDebitCard = 3
}

export enum DeliveryType {
  Delivery = 1,
  Takeout = 2
}

export interface KitchenTicketModifierDto {
  modifierName: string;
}

export interface KitchenTicketItemDto {
  productName: string;
  quantity: number;
  modifiers: KitchenTicketModifierDto[];
}

export interface KitchenOrderTicketDto {
  orderId: string;
  customerName: string;
  deliveryType: DeliveryType;
  status: OrderStatus;
  addressStreet: string;
  addressReference: string;
  createdAt: string;
  items: KitchenTicketItemDto[];
}

export interface DriverLocationResponse {
  driverId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
}

export type OrderDto = OrderDetailResponse;

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
  bankDetails: TenantBankDetailsDto;
  heroSlides: TenantHeroSlide[];
  promotionalBanners: TenantPromoBanner[];
  branches: TenantBranchSummaryDto[];
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
  bankDetails: TenantBankDetailsDto;
  heroSlides: TenantHeroSlide[];
  promotionalBanners: TenantPromoBanner[];
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
