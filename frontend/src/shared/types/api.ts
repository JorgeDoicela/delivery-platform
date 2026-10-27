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
