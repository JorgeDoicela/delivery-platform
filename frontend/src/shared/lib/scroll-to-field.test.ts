import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { scrollToFormField } from "./scroll-to-field";

describe("scrollToFormField", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = "";
    Object.defineProperty(window, "scrollY", { value: 600, writable: true, configurable: true });
    Object.defineProperty(window, "innerHeight", { value: 800, writable: true, configurable: true });
    Object.defineProperty(document.documentElement, "scrollHeight", {
      value: 2000,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("hace scroll suave hasta el campo compensando el header y enfoca solo al terminar el scroll", () => {
    const header = document.createElement("header");
    header.style.position = "sticky";
    vi.spyOn(header, "getBoundingClientRect").mockReturnValue({
      top: 0,
      bottom: 64,
      height: 64,
      left: 0,
      right: 400,
      width: 400,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    document.body.appendChild(header);

    const wrapper = document.createElement("div");
    const input = document.createElement("input");
    wrapper.appendChild(input);
    document.body.appendChild(wrapper);

    vi.spyOn(wrapper, "getBoundingClientRect").mockReturnValue({
      top: -300,
      bottom: -250,
      height: 50,
      left: 0,
      right: 300,
      width: 300,
      x: 0,
      y: -300,
      toJSON: () => ({}),
    });

    const scrollToSpy = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    const focusSpy = vi.spyOn(input, "focus").mockImplementation(() => {});

    // Simular soporte nativo de scrollend
    Object.defineProperty(window, "onscrollend", { value: null, configurable: true });

    scrollToFormField(wrapper);

    // 600 + (-300) - (64 + 24) = 212
    expect(scrollToSpy).toHaveBeenCalledWith({ top: 212, behavior: "smooth" });
    // No debe enfocar todavía mientras el scroll suave está en curso
    expect(focusSpy).not.toHaveBeenCalled();

    // Al finalizar el scroll, debe enfocar con preventScroll: true
    window.dispatchEvent(new Event("scrollend"));
    expect(focusSpy).toHaveBeenCalledTimes(1);
    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
  });

  it("enfoca inmediatamente si el campo ya está en la posición destino", () => {
    Object.defineProperty(window, "scrollY", { value: 200, writable: true, configurable: true });

    const wrapper = document.createElement("div");
    const input = document.createElement("input");
    wrapper.appendChild(input);
    document.body.appendChild(wrapper);

    // 200 + 112 - (88 + 24) = 200 (diferencia 0)
    vi.spyOn(wrapper, "getBoundingClientRect").mockReturnValue({
      top: 112,
      bottom: 162,
      height: 50,
      left: 0,
      right: 300,
      width: 300,
      x: 0,
      y: 112,
      toJSON: () => ({}),
    });

    const scrollToSpy = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    const focusSpy = vi.spyOn(input, "focus").mockImplementation(() => {});

    scrollToFormField(wrapper);

    expect(scrollToSpy).not.toHaveBeenCalled();
    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
  });
});
