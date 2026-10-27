import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

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

interface CartState {
  items: CartItem[];
  branchId: number | null;
  branchName: string | null;
  deliveryType: "delivery" | "takeout";

  // Acciones
  setBranch: (branchId: number, branchName: string) => void;
  setDeliveryType: (type: "delivery" | "takeout") => void;
  addItem: (
    item: Omit<CartItem, "cartItemId" | "itemPrice">
  ) => void;
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
      items: [],
      branchId: 1, // Sucursal Norte por defecto
      branchName: "Sucursal #1 (Norte)",
      deliveryType: "delivery",

      setBranch: (branchId, branchName) =>
        set({ branchId, branchName }),

      setDeliveryType: (deliveryType) =>
        set({ deliveryType }),

      addItem: (item) => {
        const sortedModIds = [...item.selectedModifiers]
          .map((m) => m.id)
          .sort((a, b) => a - b)
          .join("-");

        const cartItemId = `${item.productId}_${sortedModIds}`;
        const modifiersSum = item.selectedModifiers.reduce((acc, m) => acc + m.price, 0);
        const itemPrice = item.unitPrice + modifiersSum;

        const currentItems = get().items;
        const existingIndex = currentItems.findIndex((i) => i.cartItemId === cartItemId);

        if (existingIndex > -1) {
          const updated = [...currentItems];
          updated[existingIndex].quantity += item.quantity;
          set({ items: updated });
        } else {
          set({
            items: [
              ...currentItems,
              {
                ...item,
                cartItemId,
                itemPrice,
              },
            ],
          });
        }
      },

      removeItem: (cartItemId) =>
        set((state) => ({
          items: state.items.filter((i) => i.cartItemId !== cartItemId),
        })),

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

          return { items: updated };
        }),

      clearCart: () => set({ items: [] }),

      getSubtotal: () => {
        return get().items.reduce(
          (sum, item) => sum + item.itemPrice * item.quantity,
          0
        );
      },

      getDeliveryFee: () => {
        return get().deliveryType === "delivery" ? 1.50 : 0.00;
      },

      getTotal: () => {
        const subtotal = get().getSubtotal();
        if (subtotal === 0) return 0;
        return subtotal + get().getDeliveryFee();
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
