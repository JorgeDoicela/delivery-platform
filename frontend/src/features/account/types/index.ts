export type IdentificationType = "CEDULA" | "RUC" | "PASAPORTE" | "CONSUMIDOR_FINAL";

export interface AccountProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: string;
  isEmailVerified: boolean;
  tenantId: string | null;
  tenantSlug: string | null;
  tenantName: string | null;
  identificationType: IdentificationType | null;
  identificationNumber: string | null;
  hasWhatsAppConsent: boolean;
  activeOrdersCount: number;
  totalOrdersCount: number;
}

export interface AccountAddress {
  id: string;
  label: string;
  street: string;
  secondaryStreet?: string | null;
  reference?: string | null;
  buildingNumber?: string | null;
  latitude: number;
  longitude: number;
  isDefault: boolean;
  createdAt: string;
}

export interface AccountOrderItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface AccountOrderSummary {
  orderId: string;
  orderNumber: number;
  tenantSlug: string;
  tenantName: string;
  branchName: string;
  status: number;
  statusText: string;
  total: number;
  subtotal: number;
  deliveryFee: number;
  addressStreet: string;
  deliveryNotes?: string | null;
  createdAt: string;
  isActive: boolean;
  items: AccountOrderItem[];
}

export interface GetMyOrdersResponse {
  orders: AccountOrderSummary[];
  totalCount: number;
}

export interface UpdateProfilePayload {
  fullName: string;
  phone: string;
  identificationType?: IdentificationType | null;
  identificationNumber?: string | null;
}

export interface UpsertAddressPayload {
  id?: string | null;
  label: string;
  street: string;
  secondaryStreet?: string | null;
  reference?: string | null;
  buildingNumber?: string | null;
  latitude: number;
  longitude: number;
  isDefault?: boolean;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UpdateConsentPayload {
  whatsAppConsent: boolean;
}
