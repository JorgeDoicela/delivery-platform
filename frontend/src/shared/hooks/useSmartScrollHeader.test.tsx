import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useSmartScrollHeader } from "./useSmartScrollHeader";

function TestComponent({
  onStateChange,
  threshold,
  pinThreshold,
}: {
  onStateChange: (state: { isVisible: boolean; isScrolled: boolean }) => void;
  threshold?: number;
  pinThreshold?: number;
}) {
  const state = useSmartScrollHeader({ threshold, pinThreshold });
  React.useEffect(() => {
    onStateChange(state);
  }, [state, onStateChange]);
  return <div data-visible={state.isVisible} data-scrolled={state.isScrolled} />;
}

describe("useSmartScrollHeader", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    vi.stubGlobal("scrollY", 0);
    vi.stubGlobal("innerWidth", 1024);
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.restoreAllMocks();
    document.documentElement.style.removeProperty("--storefront-header-offset");
  });

  it("debe inicializarse con visibilidad activa y no scrolleado", () => {
    let latestState = { isVisible: false, isScrolled: true };
    const root = createRoot(container);

    act(() => {
      root.render(
        <TestComponent
          onStateChange={(s) => {
            latestState = s;
          }}
        />
      );
    });

    expect(latestState.isVisible).toBe(true);
    expect(latestState.isScrolled).toBe(false);
    expect(
      document.documentElement.style.getPropertyValue("--storefront-header-offset")
    ).toBe("76px");
  });

  it("debe sincronizar offset de 52px en pantallas moviles", () => {
    vi.stubGlobal("innerWidth", 390);
    const root = createRoot(container);

    act(() => {
      root.render(<TestComponent onStateChange={() => {}} />);
    });

    expect(
      document.documentElement.style.getPropertyValue("--storefront-header-offset")
    ).toBe("52px");
  });

  it("debe ocultarse al hacer scroll hacia abajo superando el umbral", () => {
    let latestState = { isVisible: true, isScrolled: false };
    const root = createRoot(container);

    act(() => {
      root.render(
        <TestComponent
          threshold={10}
          pinThreshold={50}
          onStateChange={(s) => {
            latestState = s;
          }}
        />
      );
    });

    // Scroll hacia abajo a 200px
    act(() => {
      vi.stubGlobal("scrollY", 200);
      window.dispatchEvent(new Event("scroll"));
    });

    expect(latestState.isVisible).toBe(false);
    expect(latestState.isScrolled).toBe(true);
    expect(
      document.documentElement.style.getPropertyValue("--storefront-header-offset")
    ).toBe("0px");
  });

  it("debe reaparecer inmediatamente al hacer scroll hacia arriba", () => {
    const root = createRoot(container);

    act(() => {
      root.render(
        <TestComponent
          threshold={10}
          pinThreshold={50}
          onStateChange={() => {}}
        />
      );
    });

    // 1. Scroll hacia abajo
    act(() => {
      vi.stubGlobal("scrollY", 300);
      window.dispatchEvent(new Event("scroll"));
    });
    expect(container.querySelector("div")?.getAttribute("data-visible")).toBe("false");

    // 2. Scroll hacia arriba (de 300 a 250)
    act(() => {
      vi.stubGlobal("scrollY", 250);
      window.dispatchEvent(new Event("scroll"));
    });

    expect(container.querySelector("div")?.getAttribute("data-visible")).toBe("true");
    expect(
      document.documentElement.style.getPropertyValue("--storefront-header-offset")
    ).toBe("76px");
  });

  it("debe mantenerse siempre visible si scrollY esta dentro de pinThreshold", () => {
    let latestState = { isVisible: false, isScrolled: false };
    const root = createRoot(container);

    act(() => {
      root.render(
        <TestComponent
          threshold={10}
          pinThreshold={80}
          onStateChange={(s) => {
            latestState = s;
          }}
        />
      );
    });

    act(() => {
      vi.stubGlobal("scrollY", 40);
      window.dispatchEvent(new Event("scroll"));
    });

    expect(latestState.isVisible).toBe(true);
  });
});
