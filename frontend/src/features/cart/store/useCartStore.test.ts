import { describe, it, expect, beforeEach } from "vitest";
import { useCartStore } from "./useCartStore";

describe("useCartStore", () => {
  beforeEach(() => {
    useCartStore.getState().syncTenantContext("la-granjita", 1.5, { id: 1, name: "Sucursal #1 (Norte)" });
    useCartStore.getState().clearCart();
    useCartStore.getState().setDeliveryType("delivery");
    useCartStore.getState().setBranch(1, "Sucursal #1 (Norte)");
  });

  it("debe inicializarse con carrito vacio", () => {
    const state = useCartStore.getState();
    expect(state.items).toEqual([]);
    expect(state.getItemCount()).toBe(0);
    expect(state.getSubtotal()).toBe(0);
    expect(state.getTotal()).toBe(0);
  });

  it("debe agregar un producto sin modificadores y calcular precio correctamente", () => {
    useCartStore.getState().addItem({
      productId: 10,
      name: "Pollo Entero Asado",
      unitPrice: 15.0,
      imageUrl: "/images/pollo.webp",
      quantity: 1,
      selectedModifiers: [],
    });

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].cartItemId).toBe("10_");
    expect(state.items[0].itemPrice).toBe(15.0);
    expect(state.items[0].quantity).toBe(1);
    expect(state.getItemCount()).toBe(1);
    expect(state.getSubtotal()).toBe(15.0);
    expect(state.getDeliveryFee()).toBe(1.5);
    expect(state.getTotal()).toBe(16.5);
  });

  it("debe sumar el costo de modificadores al itemPrice y ordenar los IDs en cartItemId", () => {
    useCartStore.getState().addItem({
      productId: 10,
      name: "Pollo Entero Asado",
      unitPrice: 15.0,
      imageUrl: "/images/pollo.webp",
      quantity: 1,
      selectedModifiers: [
        { id: 30, name: "Papas Fritas Grandes", price: 2.5, groupName: "Acompañamiento" },
        { id: 20, name: "Gaseosa 1.5L", price: 2.0, groupName: "Bebida" },
      ],
    });

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    // El cartItemId debe ordenar modificadores: 20 antes de 30
    expect(state.items[0].cartItemId).toBe("10_20-30");
    expect(state.items[0].itemPrice).toBe(19.5); // 15.0 + 2.5 + 2.0
    expect(state.getSubtotal()).toBe(19.5);
  });

  it("debe incrementar cantidad al agregar el mismo producto con identicos modificadores", () => {
    const itemData = {
      productId: 10,
      name: "Pollo Entero Asado",
      unitPrice: 15.0,
      imageUrl: "/images/pollo.webp",
      quantity: 1,
      selectedModifiers: [{ id: 5, name: "Salsa Extra", price: 0.5, groupName: "Salsas" }],
    };

    useCartStore.getState().addItem(itemData);
    useCartStore.getState().addItem(itemData);

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(2);
    expect(state.getItemCount()).toBe(2);
    expect(state.getSubtotal()).toBe(31.0); // (15 + 0.5) * 2
  });

  it("debe crear entradas separadas para el mismo producto con diferentes modificadores", () => {
    useCartStore.getState().addItem({
      productId: 10,
      name: "Pollo Entero Asado",
      unitPrice: 15.0,
      imageUrl: "/images/pollo.webp",
      quantity: 1,
      selectedModifiers: [{ id: 1, name: "Papas", price: 1.0, groupName: "Guarnicion" }],
    });

    useCartStore.getState().addItem({
      productId: 10,
      name: "Pollo Entero Asado",
      unitPrice: 15.0,
      imageUrl: "/images/pollo.webp",
      quantity: 1,
      selectedModifiers: [{ id: 2, name: "Yuca", price: 1.5, groupName: "Guarnicion" }],
    });

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(2);
    expect(state.getItemCount()).toBe(2);
  });

  it("debe actualizar la cantidad mediante updateQuantity y remover al llegar a cero", () => {
    useCartStore.getState().addItem({
      productId: 1,
      name: "Combo Familiar",
      unitPrice: 20.0,
      imageUrl: "/images/combo.webp",
      quantity: 2,
      selectedModifiers: [],
    });

    const cartItemId = useCartStore.getState().items[0].cartItemId;

    // Incrementar en 1
    useCartStore.getState().updateQuantity(cartItemId, 1);
    expect(useCartStore.getState().items[0].quantity).toBe(3);

    // Decrementar en 2
    useCartStore.getState().updateQuantity(cartItemId, -2);
    expect(useCartStore.getState().items[0].quantity).toBe(1);

    // Decrementar en 1 -> debe eliminarse
    useCartStore.getState().updateQuantity(cartItemId, -1);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("debe remover un item directamente con removeItem", () => {
    useCartStore.getState().addItem({
      productId: 1,
      name: "Combo Familiar",
      unitPrice: 20.0,
      imageUrl: "/images/combo.webp",
      quantity: 1,
      selectedModifiers: [],
    });

    const cartItemId = useCartStore.getState().items[0].cartItemId;
    useCartStore.getState().removeItem(cartItemId);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("debe asignar 0.00 de tarifa de envio si el tipo es takeout", () => {
    useCartStore.getState().addItem({
      productId: 1,
      name: "Combo Familiar",
      unitPrice: 20.0,
      imageUrl: "/images/combo.webp",
      quantity: 1,
      selectedModifiers: [],
    });

    useCartStore.getState().setDeliveryType("takeout");

    const state = useCartStore.getState();
    expect(state.getDeliveryFee()).toBe(0.0);
    expect(state.getTotal()).toBe(20.0);
  });

  it("debe aislar items, sucursal y tarifa base de envio por tenant con syncTenantContext", () => {
    useCartStore.getState().addItem({
      productId: 10,
      name: "Pollo Entero Asado",
      unitPrice: 15.0,
      imageUrl: "/images/pollo.webp",
      quantity: 1,
      selectedModifiers: [],
    });

    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().getDeliveryFee()).toBe(1.5);

    // Cambiar al tenant brasas-del-valle con tarifa de envio 2.00
    useCartStore
      .getState()
      .syncTenantContext("brasas-del-valle", 2.0, { id: 3, name: "Parrilla Cumbaya" });

    expect(useCartStore.getState().tenantSlug).toBe("brasas-del-valle");
    expect(useCartStore.getState().items).toHaveLength(0);
    expect(useCartStore.getState().branchId).toBe(3);

    useCartStore.getState().addItem({
      productId: 201,
      name: "Bife de Chorizo",
      unitPrice: 24.5,
      imageUrl: "/images/bife.webp",
      quantity: 1,
      selectedModifiers: [],
    });

    expect(useCartStore.getState().getDeliveryFee()).toBe(2.0);
    expect(useCartStore.getState().getTotal()).toBe(26.5);

    // Regresar a la-granjita debe restaurar su carrito intacto
    useCartStore
      .getState()
      .syncTenantContext("la-granjita", 1.5, { id: 1, name: "Sucursal #1 (Norte)" });

    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].productId).toBe(10);
    expect(useCartStore.getState().getDeliveryFee()).toBe(1.5);
  });
});
