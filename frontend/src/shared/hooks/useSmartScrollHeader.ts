"use client";

import { useState, useEffect, useRef } from "react";

export interface SmartScrollHeaderOptions {
  /**
   * Píxeles mínimos de desplazamiento en una dirección antes de alternar visibilidad
   */
  threshold?: number;
  /**
   * Altura superior en píxeles donde el header siempre permanece visible
   */
  pinThreshold?: number;
}

export function useSmartScrollHeader(options: SmartScrollHeaderOptions = {}) {
  const { threshold = 15, pinThreshold = 80 } = options;
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const lastScrollYRef = useRef(0);

  // Sincroniza dinámicamente la variable CSS global para elementos sticky dependientes (ej. subnav de categorías)
  useEffect(() => {
    if (typeof document === "undefined") return;

    const updateOffset = () => {
      const isMobile =
        typeof window !== "undefined" &&
        window.innerWidth > 0 &&
        window.innerWidth < 640;
      const height = isMobile ? "52px" : "76px";

      document.documentElement.style.setProperty(
        "--storefront-header-offset",
        isVisible ? height : "0px"
      );
    };

    updateOffset();

    window.addEventListener("resize", updateOffset);
    return () => window.removeEventListener("resize", updateOffset);
  }, [isVisible]);

  useEffect(() => {
    let ticking = false;

    const updateHeader = () => {
      const currentScrollY = window.scrollY;

      // Protección contra rebote elástico en iOS y macOS
      if (currentScrollY <= 0) {
        setIsVisible(true);
        setIsScrolled(false);
        lastScrollYRef.current = 0;
        ticking = false;
        return;
      }

      setIsScrolled(currentScrollY > 10);

      const diff = currentScrollY - lastScrollYRef.current;

      // Cerca del tope siempre visible
      if (currentScrollY <= pinThreshold) {
        setIsVisible(true);
      } else if (Math.abs(diff) >= threshold) {
        if (diff > 0) {
          // Desplazamiento hacia ABAJO: ocultar de manera fluida
          setIsVisible(false);
        } else {
          // Desplazamiento hacia ARRIBA: mostrar inmediatamente
          setIsVisible(true);
        }
        lastScrollYRef.current = currentScrollY;
      }

      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(updateHeader);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold, pinThreshold]);

  return { isVisible, isScrolled, setIsVisible };
}
