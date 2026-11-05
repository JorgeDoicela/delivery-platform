import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { DEFAULT_TENANT_SLUG } from "@/shared/lib/api-client";

export interface SelectedModifier {
  id: number;
  name: string;
  price: number;
  groupName: string;
}

export interface CartItem {
  cartItemId: string; // Hash único del producto + modificadores seleccionados
  productId: number;
  name: string;
  unitPrice: number;
  imageUrl: string;
  quantity: number;
  selectedModifiers: SelectedModifier[];
  itemPrice: number; // unitPrice + modificadores con costo
}

export interface CartUtensilsConfig {
  enabled: boolean;
  sauces: boolean;
  cutlery: boolean;
  napkins: boolean;
}

export interface TenantCartSnapshot {
  items: CartItem[];
  branchId: number | null;
  branchName: string | null;
  deliveryType: "delivery" | "takeout";
  baseDeliveryFee: number;
  utensils?: CartUtensilsConfig;
  couponCode?: string | null;
  discountAmount?: number;
}

interface CartState {
  tenantSlug: string;
  items: CartItem[];
  branchId: number | null;
  branchName: string | null;
  deliveryType: "delivery" | "takeout";
  baseDeliveryFee: number;
  cartsByTenant: Record<string, TenantCartSnapshot>;

  // Estado del Drawer Lateral
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;

  // Utensilios y Cortesía
  utensils: CartUtensilsConfig;
  setUtensilsEnabled: (enabled: boolean) => void;
  setUtensilOption: (option: "sauces" | "cutlery" | "napkins", value: boolean) => void;

  // Cupones y Descuentos
  couponCode: string | null;
  discountAmount: number;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;

  // Acciones
  syncTenantContext: (
    tenantSlug: string,
    baseDeliveryFee: number,
    defaultBranch?: { id: number; name: string }
  ) => void;
  setBranch: (branchId: number, branchName: string) => void;
  setDeliveryType: (type: "delivery" | "takeout") => void;
  addItem: (item: Omit<CartItem, "cartItemId" | "itemPrice">) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  clearCart: () => void;

  // Cálculos derivados
  getSubtotal: () => number;
  getDeliveryFee: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      tenantSlug: DEFAULT_TENANT_SLUG,
      items: [],
      branchId: 1,
      branchName: "Guamaní",
      deliveryType: "delivery",
      baseDeliveryFee: 1.5,
      cartsByTenant: {},

      // Estado del Drawer Lateral
      isCartOpen: false,
      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),
      toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),

      // Utensilios y Cortesía
      utensils: {
        enabled: true,
        sauces: true,
        cutlery: true,
        napkins: true,
      },
      setUtensilsEnabled: (enabled) =>
        set((s) => ({ utensils: { ...s.utensils, enabled } })),
      setUtensilOption: (option, value) =>
        set((s) => ({ utensils: { ...s.utensils, [option]: value } })),

      // Cupones y Descuentos
      couponCode: null,
      discountAmount: 0,
      applyCoupon: (code: string) => {
        const clean = code.trim().toUpperCase();
        if (clean === "MESAFY10" || clean === "DESCUENTO10") {
          const subtotal = get().getSubtotal();
          const discount = Math.round(subtotal * 0.1 * 100) / 100;
          set({ couponCode: clean, discountAmount: discount });
          return true;
        }
        if (clean === "GRANJITA" || clean === "ENVIOGRATIS") {
          const deliveryFee = get().getDeliveryFee();
          set({ couponCode: clean, discountAmount: deliveryFee });
          return true;
        }
        return false;
      },
      removeCoupon: () => set({ couponCode: null, discountAmount: 0 }),

      syncTenantContext: (nextSlug, nextFee, defaultBranch) => {
        const normalizedSlug = nextSlug.trim().toLowerCase();
        const state = get();

        const currentSnapshot: TenantCartSnapshot = {
          items: state.items,
          branchId: state.branchId,
          branchName: state.branchName,
          deliveryType: state.deliveryType,
          baseDeliveryFee: state.baseDeliveryFee,
        };

        const updatedMap: Record<string, TenantCartSnapshot> = {
          ...state.cartsByTenant,
          [state.tenantSlug]: currentSnapshot,
        };

        if (state.tenantSlug === normalizedSlug) {
          const validBranchId =
            state.branchId ?? defaultBranch?.id ?? 1;
          const validBranchName =
            state.branchName ?? defaultBranch?.name ?? "Matriz Principal";

          set({
            baseDeliveryFee: nextFee,
            branchId: validBranchId,
            branchName: validBranchName,
            cartsByTenant: {
              ...updatedMap,
              [normalizedSlug]: {
                ...currentSnapshot,
                baseDeliveryFee: nextFee,
                branchId: validBranchId,
                branchName: validBranchName,
              },
            },
          });
          return;
        }

        const existingForNext = updatedMap[normalizedSlug];
        if (existingForNext) {
          set({
            tenantSlug: normalizedSlug,
            items: existingForNext.items,
            branchId: existingForNext.branchId ?? defaultBranch?.id ?? 1,
            branchName:
              existingForNext.branchName ??
              defaultBranch?.name ??
              "Matriz Principal",
            deliveryType: existingForNext.deliveryType,
            baseDeliveryFee: nextFee,
            cartsByTenant: updatedMap,
          });
        } else {
          const initialBranchId = defaultBranch?.id ?? 1;
          const initialBranchName = defaultBranch?.name ?? "Matriz Principal";
          const freshSnapshot: TenantCartSnapshot = {
            items: [],
            branchId: initialBranchId,
            branchName: initialBranchName,
            deliveryType: "delivery",
            baseDeliveryFee: nextFee,
          };

          set({
            tenantSlug: normalizedSlug,
            items: [],
            branchId: initialBranchId,
            branchName: initialBranchName,
            deliveryType: "delivery",
            baseDeliveryFee: nextFee,
            cartsByTenant: {
              ...updatedMap,
              [normalizedSlug]: freshSnapshot,
            },
          });
        }
      },

      setBranch: (branchId, branchName) =>
        set((state) => ({
          branchId,
          branchName,
          cartsByTenant: {
            ...state.cartsByTenant,
            [state.tenantSlug]: {
              items: state.items,
              branchId,
              branchName,
              deliveryType: state.deliveryType,
              baseDeliveryFee: state.baseDeliveryFee,
            },
          },
        })),

      setDeliveryType: (deliveryType) =>
        set((state) => ({
          deliveryType,
          cartsByTenant: {
            ...state.cartsByTenant,
            [state.tenantSlug]: {
              items: state.items,
              branchId: state.branchId,
              branchName: state.branchName,
              deliveryType,
              baseDeliveryFee: state.baseDeliveryFee,
            },
          },
        })),

      addItem: (item) => {
        const sortedModIds = [...item.selectedModifiers]
          .map((m) => m.id)
          .sort((a, b) => a - b)
          .join("-");

        const cartItemId = `${item.productId}_${sortedModIds}`;
        const modifiersSum = item.selectedModifiers.reduce(
          (acc, m) => acc + m.price,
          0
        );
        const itemPrice = item.unitPrice + modifiersSum;

        const state = get();
        const currentItems = state.items;
        const existingIndex = currentItems.findIndex(
          (i) => i.cartItemId === cartItemId
        );

        let nextItems: CartItem[];
        if (existingIndex > -1) {
          nextItems = [...currentItems];
          nextItems[existingIndex] = {
            ...nextItems[existingIndex],
            quantity: nextItems[existingIndex].quantity + item.quantity,
          };
        } else {
          nextItems = [
            ...currentItems,
            {
              ...item,
              cartItemId,
              itemPrice,
            },
          ];
        }

        set({
          items: nextItems,
          cartsByTenant: {
            ...state.cartsByTenant,
            [state.tenantSlug]: {
              items: nextItems,
              branchId: state.branchId,
              branchName: state.branchName,
              deliveryType: state.deliveryType,
              baseDeliveryFee: state.baseDeliveryFee,
            },
          },
        });
      },

      removeItem: (cartItemId) =>
        set((state) => {
          const nextItems = state.items.filter(
            (i) => i.cartItemId !== cartItemId
          );
          return {
            items: nextItems,
            cartsByTenant: {
              ...state.cartsByTenant,
              [state.tenantSlug]: {
                items: nextItems,
                branchId: state.branchId,
                branchName: state.branchName,
                deliveryType: state.deliveryType,
                baseDeliveryFee: state.baseDeliveryFee,
              },
            },
          };
        }),

      updateQuantity: (cartItemId, delta) =>
        set((state) => {
          const updated = state.items
            .map((item) => {
              if (item.cartItemId === cartItemId) {
                const newQty = item.quantity + delta;
                return newQty > 0 ? { ...item, quantity: newQty } : null;
              }
              return item;
            })
            .filter((item): item is CartItem => item !== null);

          return {
            items: updated,
            cartsByTenant: {
              ...state.cartsByTenant,
              [state.tenantSlug]: {
                items: updated,
                branchId: state.branchId,
                branchName: state.branchName,
                deliveryType: state.deliveryType,
                baseDeliveryFee: state.baseDeliveryFee,
              },
            },
          };
        }),

      clearCart: () =>
        set((state) => ({
          items: [],
          cartsByTenant: {
            ...state.cartsByTenant,
            [state.tenantSlug]: {
              items: [],
              branchId: state.branchId,
              branchName: state.branchName,
              deliveryType: state.deliveryType,
              baseDeliveryFee: state.baseDeliveryFee,
            },
          },
        })),

      getSubtotal: () => {
        return get().items.reduce(
          (sum, item) => sum + item.itemPrice * item.quantity,
          0
        );
      },

      getDeliveryFee: () => {
        return get().deliveryType === "delivery" ? get().baseDeliveryFee : 0.0;
      },

      getTotal: () => {
        const subtotal = get().getSubtotal();
        if (subtotal === 0) return 0;
        const total = subtotal + get().getDeliveryFee() - (get().discountAmount || 0);
        return Math.max(0, Math.round(total * 100) / 100);
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: "delivery_cart_storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
