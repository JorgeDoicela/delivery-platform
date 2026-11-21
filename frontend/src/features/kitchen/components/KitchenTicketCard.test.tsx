import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { KitchenTicketCard } from "./KitchenTicketCard";
import {
  DeliveryType,
  OrderStatus,
  PaymentMethod,
  type KitchenOrderTicketDto,
} from "@/shared/types/api";

function buildTicket(overrides?: Partial<KitchenOrderTicketDto>): KitchenOrderTicketDto {
  return {
    orderId: "11111111-1111-1111-1111-111111111111",
    customerName: "Cliente Prueba",
    deliveryType: DeliveryType.Takeout,
    status: OrderStatus.Confirmed,
    addressStreet: "Retiro en mostrador",
    addressReference: "",
    createdAt: new Date().toISOString(),
    items: [{ productName: "Combo Familiar", quantity: 1, modifiers: [] }],
    paymentMethod: PaymentMethod.Cash,
    total: 15.5,
    ...overrides,
  };
}

describe("KitchenTicketCard - Flujo Cocina vs Solo Mostrador", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("muestra 'Iniciar en Cocina' cuando useKitchenWorkflow esta activo", async () => {
    const onAdvance = vi.fn().mockResolvedValue(undefined);
    await act(async () => {
      root.render(
        <KitchenTicketCard
          order={buildTicket()}
          onAdvance={onAdvance}
          useKitchenWorkflow={true}
        />
      );
    });

    const buttons = Array.from(container.querySelectorAll("button"));
    expect(buttons.some((b) => b.textContent?.includes("Iniciar en Cocina"))).toBe(true);
  });

  it("en modo Solo Mostrador con Takeout y entrega directa habilitada muestra 'Marcar Listo' y 'Entregar'", async () => {
    const onAdvance = vi.fn().mockResolvedValue(undefined);
    await act(async () => {
      root.render(
        <KitchenTicketCard
          order={buildTicket({ deliveryType: DeliveryType.Takeout })}
          onAdvance={onAdvance}
          useKitchenWorkflow={false}
          allowDirectCounterTakeoutDelivery={true}
        />
      );
    });

    const buttons = Array.from(container.querySelectorAll("button"));
    expect(buttons.some((b) => b.textContent?.includes("Marcar Listo"))).toBe(true);
    expect(buttons.some((b) => b.textContent?.includes("Entregar"))).toBe(true);
  });

  it("en modo Solo Mostrador con Takeout y entrega directa deshabilitada exige 'Listo en Mostrador'", async () => {
    const onAdvance = vi.fn().mockResolvedValue(undefined);
    await act(async () => {
      root.render(
        <KitchenTicketCard
          order={buildTicket({ deliveryType: DeliveryType.Takeout })}
          onAdvance={onAdvance}
          useKitchenWorkflow={false}
          allowDirectCounterTakeoutDelivery={false}
        />
      );
    });

    const buttons = Array.from(container.querySelectorAll("button"));
    expect(buttons.some((b) => b.textContent?.includes("Listo en Mostrador"))).toBe(true);
    expect(buttons.some((b) => b.textContent?.includes("Entregar"))).toBe(false);
  });

  it("en modo Solo Mostrador con Delivery muestra 'Listo para Reparto'", async () => {
    const onAdvance = vi.fn().mockResolvedValue(undefined);
    await act(async () => {
      root.render(
        <KitchenTicketCard
          order={buildTicket({ deliveryType: DeliveryType.Delivery })}
          onAdvance={onAdvance}
          useKitchenWorkflow={false}
        />
      );
    });

    const buttons = Array.from(container.querySelectorAll("button"));
    expect(buttons.some((b) => b.textContent?.includes("Listo para Reparto"))).toBe(true);
  });
});
