import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FloatingPwaInstallButton } from "./FloatingPwaInstallButton";
import * as pwaHook from "../hooks/usePwaInstall";

vi.mock("../hooks/useTenantQueries", () => ({
  useCurrentTenantQuery: () => ({
    data: {
      id: "tenant-1",
      name: "La Granjita",
      slug: "la-granjita",
      branches: [{ id: 1, name: "Matriz" }],
    },
  }),
}));

vi.mock("@/features/cart", () => ({
  useCartStore: (selector: (state: { branchId: number | null }) => unknown) =>
    selector({ branchId: 1 }),
}));

describe("FloatingPwaInstallButton", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    vi.restoreAllMocks();
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("renderiza el botón con el nombre del tenant y sucursal cuando no está instalada", async () => {
    vi.spyOn(pwaHook, "usePwaInstall").mockReturnValue({
      isSupported: true,
      isInstalled: false,
      isIos: false,
      hasPrompt: true,
      triggerInstall: vi.fn().mockResolvedValue(true),
    });

    await act(async () => {
      root.render(<FloatingPwaInstallButton />);
    });

    const button = container.querySelector("button");
    expect(button).not.toBeNull();
    expect(button?.getAttribute("aria-label")).toContain("La Granjita (Matriz)");
  });

  it("no renderiza nada si la aplicación ya está instalada (standalone)", async () => {
    vi.spyOn(pwaHook, "usePwaInstall").mockReturnValue({
      isSupported: true,
      isInstalled: true,
      isIos: false,
      hasPrompt: false,
      triggerInstall: vi.fn(),
    });

    await act(async () => {
      root.render(<FloatingPwaInstallButton />);
    });

    const button = container.querySelector("button");
    expect(button).toBeNull();
  });

  it("ejecuta triggerInstall al hacer clic cuando hasPrompt es verdadero", async () => {
    const triggerInstallMock = vi.fn().mockResolvedValue(true);
    vi.spyOn(pwaHook, "usePwaInstall").mockReturnValue({
      isSupported: true,
      isInstalled: false,
      isIos: false,
      hasPrompt: true,
      triggerInstall: triggerInstallMock,
    });

    await act(async () => {
      root.render(<FloatingPwaInstallButton />);
    });

    const button = container.querySelector("button");
    await act(async () => {
      button?.click();
    });

    expect(triggerInstallMock).toHaveBeenCalled();
  });
});
