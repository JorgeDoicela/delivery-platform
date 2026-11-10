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
  isEmailVerified?: boolean;
  emailVerifiedAt?: string | null;
  avatarUrl?: string | null;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
  expiresAt: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
  tenantSlug?: string;
  identificationType?: string;
  identificationNumber?: string;
}

export type RegisterResponse = LoginResponse;

export interface GoogleAuthRequest {
  idToken: string;
  tenantSlug?: string;
}

export type GoogleAuthResponse = LoginResponse;

export interface RefreshTokenResponse {
  accessToken: string;
  user: AuthUser;
  expiresAt: string;
}

export interface ForgotPasswordRequest {
  email: string;
  tenantSlug?: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordRequest {
  email: string;
  token: string;
  newPassword: string;
  tenantSlug?: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

export interface VerifyEmailRequest {
  token: string;
  email?: string;
}

export interface VerifyEmailResponse {
  success: boolean;
  message: string;
  email?: string;
  fullName?: string;
}

export interface ResendVerificationRequest {
  email: string;
  tenantSlug?: string;
}

export interface ResendVerificationResponse {
  message: string;
}

export type AuthStatus = "idle" | "loading" | "error" | "success";

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  status: AuthStatus;
  error: string | null;
  isAuthenticated: boolean;
}

