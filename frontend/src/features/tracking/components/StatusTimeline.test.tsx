import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { StatusTimeline } from "./StatusTimeline";
import { DeliveryType, OrderStatus } from "@/shared/types/api";

describe("StatusTimeline", () => {
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

  it("incluye el paso 'En Cocina' cuando useKitchenWorkflow es true", async () => {
    await act(async () => {
      root.render(
        <StatusTimeline
          status={OrderStatus.Confirmed}
          useKitchenWorkflow={true}
          deliveryType={DeliveryType.Delivery}
        />
      );
    });

    expect(container.textContent).toContain("En Cocina");
    expect(container.textContent).toContain("En Camino");
  });

  it("omite el paso 'En Cocina' cuando useKitchenWorkflow es false", async () => {
    await act(async () => {
      root.render(
        <StatusTimeline
          status={OrderStatus.ReadyForDelivery}
          useKitchenWorkflow={false}
          deliveryType={DeliveryType.Delivery}
        />
      );
    });

    expect(container.textContent).not.toContain("En Cocina");
    expect(container.textContent).toContain("Empacado");
    expect(container.textContent).toContain("En Camino");
  });

  it("omite 'En Cocina' y 'En Camino' para pedidos Takeout en modo Solo Mostrador", async () => {
    await act(async () => {
      root.render(
        <StatusTimeline
          status={OrderStatus.ReadyForDelivery}
          useKitchenWorkflow={false}
          deliveryType={DeliveryType.Takeout}
        />
      );
    });

    expect(container.textContent).not.toContain("En Cocina");
    expect(container.textContent).not.toContain("En Camino");
    expect(container.textContent).toContain("Listo en Local");
  });
});
