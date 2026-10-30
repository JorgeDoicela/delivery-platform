// Contratos y tipos de autenticacion y RBAC sincronizados con .NET 8 (Delivery.Features.Auth)

export enum UserRole {
  SuperAdmin = 1,
  TenantAdmin = 2,
  BranchManager = 3,
  Cashier = 4,
  KitchenStaff = 5,
  Driver = 6,
  Customer = 7,
}

export type UserRoleName =
  | "SuperAdmin"
  | "TenantAdmin"
  | "BranchManager"
  | "Cashier"
  | "KitchenStaff"
  | "Driver"
  | "Customer";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  role: UserRole | UserRoleName;
  roles?: UserRoleName[];
  tenantId: string | null;
  tenantSlug?: string | null;
  branchId: string | number | null;
  isActive: boolean;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
  expiresAt: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  user: AuthUser;
  expiresAt: string;
}

export type AuthStatus = "idle" | "loading" | "error" | "success";

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  status: AuthStatus;
  error: string | null;
  isAuthenticated: boolean;
}

