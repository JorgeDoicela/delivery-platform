export interface ScrollToFieldOptions {
  /** Espacio adicional en píxeles debajo del encabezado fijo (default: 24). */
  extraOffset?: number;
  /** Selector CSS del encabezado fijo para compensar su altura real (default: "header"). */
  headerSelector?: string;
}

function getFocusableElement(container: HTMLElement): HTMLElement | null {
  if (container.matches("input, select, textarea, button, [tabindex]:not([tabindex='-1'])")) {
    return container;
  }
  return container.querySelector<HTMLElement>(
    "input:not([type='hidden']):not([disabled]), select:not([disabled]), textarea:not([disabled])"
  );
}

function getHeaderOffset(headerSelector: string, extraOffset: number): number {
  const header = document.querySelector<HTMLElement>(headerSelector);
  if (!header) {
    return 88 + extraOffset;
  }
  const style = window.getComputedStyle(header);
  const isStickyOrFixed = style.position === "sticky" || style.position === "fixed";
  if (!isStickyOrFixed) {
    return extraOffset;
  }
  const rect = header.getBoundingClientRect();
  return Math.max(0, rect.height) + extraOffset;
}

function getScrollParent(element: HTMLElement): HTMLElement | Window {
  let parent = element.parentElement;
  while (parent && parent !== document.body && parent !== document.documentElement) {
    const style = window.getComputedStyle(parent);
    const overflowY = style.overflowY;
    if (
      (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") &&
      parent.scrollHeight > parent.clientHeight
    ) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return window;
}

/**
 * Desplaza suavemente hasta un campo de formulario compensando el encabezado sticky
 * y enfoca el control SOLO cuando el desplazamiento ha finalizado por completo,
 * evitando que `focus()` aborte la animación `smooth` en Chromium.
 */
export function scrollToFormField(
  target: HTMLElement,
  options: ScrollToFieldOptions = {}
): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  const { extraOffset = 24, headerSelector = "header" } = options;
  const scroller = getScrollParent(target);
  const focusable = getFocusableElement(target);

  let currentScrollTop = 0;
  let destinationTop = 0;

  if (scroller === window) {
    currentScrollTop = window.scrollY;
    const offset = getHeaderOffset(headerSelector, extraOffset);
    const rawTop = window.scrollY + target.getBoundingClientRect().top - offset;
    const maxScroll = Math.max(
      0,
      document.documentElement.scrollHeight - window.innerHeight
    );
    destinationTop = Math.min(Math.max(0, rawTop), maxScroll);
  } else {
    const container = scroller as HTMLElement;
    currentScrollTop = container.scrollTop;
    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const rawTop = container.scrollTop + (targetRect.top - containerRect.top) - extraOffset;
    const maxScroll = Math.max(0, container.scrollHeight - container.clientHeight);
    destinationTop = Math.min(Math.max(0, rawTop), maxScroll);
  }

  const focusWithoutScroll = () => {
    if (focusable && document.contains(focusable)) {
      focusable.focus({ preventScroll: true });
    }
  };

  // Si el elemento ya está en la posición objetivo, enfocar directamente
  if (Math.abs(currentScrollTop - destinationTop) <= 2) {
    focusWithoutScroll();
    return;
  }

  let finished = false;
  let fallbackTimer: ReturnType<typeof setTimeout> | null = null;
  let rafId: number | null = null;

  const cleanup = () => {
    if (fallbackTimer !== null) {
      clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    scroller.removeEventListener("scrollend", handleScrollEnd);
    window.removeEventListener("wheel", cancelDeferredFocus);
    window.removeEventListener("touchstart", cancelDeferredFocus);
  };

  const handleScrollEnd = () => {
    if (finished) return;
    finished = true;
    cleanup();
    focusWithoutScroll();
  };

  const cancelDeferredFocus = () => {
    if (finished) return;
    finished = true;
    cleanup();
  };

  window.addEventListener("wheel", cancelDeferredFocus, { passive: true, once: true });
  window.addEventListener("touchstart", cancelDeferredFocus, { passive: true, once: true });

  const supportsScrollEnd = "onscrollend" in window;
  if (supportsScrollEnd) {
    scroller.addEventListener("scrollend", handleScrollEnd, { once: true });
    // Respaldo de seguridad si el entorno no dispara scrollend
    fallbackTimer = setTimeout(handleScrollEnd, 1400);
  } else {
    let lastPos = currentScrollTop;
    let stableFrames = 0;
    const startedAt = performance.now();

    const track = () => {
      if (finished) return;
      const nowPos =
        scroller === window ? window.scrollY : (scroller as HTMLElement).scrollTop;

      if (Math.abs(nowPos - destinationTop) <= 2) {
        handleScrollEnd();
        return;
      }

      if (Math.abs(nowPos - lastPos) < 0.5) {
        stableFrames += 1;
      } else {
        stableFrames = 0;
        lastPos = nowPos;
      }

      if (stableFrames >= 4 && performance.now() - startedAt > 120) {
        handleScrollEnd();
        return;
      }

      if (performance.now() - startedAt > 1400) {
        handleScrollEnd();
        return;
      }

      rafId = requestAnimationFrame(track);
    };

    rafId = requestAnimationFrame(track);
  }

  scroller.scrollTo({ top: destinationTop, behavior: "smooth" });
}
