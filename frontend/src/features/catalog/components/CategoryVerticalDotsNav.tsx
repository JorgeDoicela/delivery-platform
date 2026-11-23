"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

interface CategoryItem {
  name: string;
}

interface CategoryVerticalDotsNavProps {
  categories: CategoryItem[];
  activeCategory?: string;
  onSelectCategory: (categoryName: string, isInstant?: boolean) => void;
}

/**
 * Indicador táctil vertical de categorías estilo Scrubber / App Launcher móvil.
 * Permite arrastrar el dedo (scrubbing) verticalmente de forma fluida con magnificación
 * elástica por proximidad, respuesta háptica y burbuja contextual continua.
 * Observa de forma autónoma el viewport para no forzar re-renders en el catálogo padre.
 */
export function CategoryVerticalDotsNav({
  categories,
  activeCategory,
  onSelectCategory,
}: CategoryVerticalDotsNavProps) {
  const [internalActiveCategory, setInternalActiveCategory] = useState<string>("");
  const [isInteracting, setIsInteracting] = useState(false);
  const [scrubIndex, setScrubIndex] = useState<number | null>(null);
  const [touchYPercent, setTouchYPercent] = useState<number | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastHapticIndexRef = useRef<number | null>(null);
  const navContainerRef = useRef<HTMLDivElement | null>(null);

  // Filtrar categorías válidas (excluyendo pseudo-categoría "TODOS")
  const validCategories = categories.filter(
    (c) => c.name && c.name.toUpperCase() !== "TODOS"
  );

  // ScrollSpy profesional con requestAnimationFrame: 100% determinista, pasivo y sincronizado a 60/120fps
  useEffect(() => {
    if (validCategories.length === 0) return;

    let rafId: number | null = null;

    const updateActiveCategory = () => {
      const sections = document.querySelectorAll<HTMLElement>("section[data-category-name]");
      if (sections.length === 0) return;

      const firstCat = validCategories[0].name;

      // Línea de activación visual bajo la cabecera sticky y buscador (150px en móvil, 180px en desktop)
      const activationOffset =
        typeof window !== "undefined" && window.innerWidth < 640 ? 150 : 180;

      // 1. Si está en el tope de la carta o antes de la primera sección
      if (window.scrollY < 80) {
        setInternalActiveCategory((prev) => (prev !== firstCat ? firstCat : prev));
        return;
      }

      // 2. Si llegó al final del scroll de la página, activar deterministamente la última categoría
      const isAtBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 50;
      if (isAtBottom) {
        const lastCat = validCategories[validCategories.length - 1].name;
        setInternalActiveCategory((prev) => (prev !== lastCat ? lastCat : prev));
        return;
      }

      // 3. Evaluar la sección activa en el viewport
      let matchedCategory = firstCat;
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const rect = section.getBoundingClientRect();

        if (rect.top <= activationOffset) {
          const catName = section.getAttribute("data-category-name");
          if (catName) {
            matchedCategory = catName;
          }
        } else {
          // Las secciones vienen en orden topológico; si esta está por debajo, las siguientes también
          break;
        }
      }

      setInternalActiveCategory((prev) => (prev !== matchedCategory ? matchedCategory : prev));
    };

    const handleScroll = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        updateActiveCategory();
        rafId = null;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    // Verificación inicial inmediata
    updateActiveCategory();

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [validCategories]);

  // Limpieza de temporizadores
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  const triggerHaptic = () => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(10);
      } catch {
        // Ignorar si el dispositivo bloquea la vibración
      }
    }
  };

  const getCategoryFromY = useCallback(
    (clientY: number): { index: number; percent: number; category: CategoryItem } | null => {
      if (!navContainerRef.current || validCategories.length === 0) return null;
      const rect = navContainerRef.current.getBoundingClientRect();
      const relativeY = clientY - rect.top;
      const percent = Math.max(0, Math.min(1, relativeY / rect.height));
      const index = Math.min(
        validCategories.length - 1,
        Math.max(0, Math.floor(percent * validCategories.length))
      );
      return { index, percent, category: validCategories[index] };
    },
    [validCategories]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (validCategories.length <= 1) return;
    e.preventDefault();
    e.stopPropagation();

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // Ignorar fallo de pointer capture en plataformas no compatibles
    }

    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    setIsInteracting(true);

    const hit = getCategoryFromY(e.clientY);
    if (hit) {
      setScrubIndex(hit.index);
      setTouchYPercent(hit.percent);
      lastHapticIndexRef.current = hit.index;
      triggerHaptic();
      onSelectCategory(hit.category.name, false);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isInteracting) return;
    e.preventDefault();

    const hit = getCategoryFromY(e.clientY);
    if (hit) {
      setScrubIndex(hit.index);
      setTouchYPercent(hit.percent);

      if (lastHapticIndexRef.current !== hit.index) {
        lastHapticIndexRef.current = hit.index;
        triggerHaptic();
        // Durante el arrastre activo usamos scroll continuo
        onSelectCategory(hit.category.name, true);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isInteracting) return;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignorar
    }

    const hit = getCategoryFromY(e.clientY);
    if (hit) {
      onSelectCategory(hit.category.name, false);
    }

    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      setIsInteracting(false);
      setScrubIndex(null);
      setTouchYPercent(null);
    }, 600);
  };

  if (validCategories.length <= 1) {
    return null;
  }

  // Índice activo calculado (si se está arrastrando prima el scrub, sino la categoría en vista)
  const currentCategoryName =
    activeCategory || internalActiveCategory || validCategories[0]?.name || "";

  const activeIndex =
    scrubIndex !== null
      ? scrubIndex
      : Math.max(
          0,
          validCategories.findIndex(
            (c) => c.name.toLowerCase() === currentCategoryName.toLowerCase()
          )
        );

  const displayCategoryName =
    scrubIndex !== null && validCategories[scrubIndex]
      ? validCategories[scrubIndex].name
      : validCategories[activeIndex]?.name || "";

  return (
    <aside
      aria-label="Navegación táctil rápida de categorías"
      className="fixed right-1 top-1/2 -translate-y-1/2 z-30 block sm:hidden select-none touch-none"
    >
      {/* Burbuja flotante informativa que acompaña el desplazamiento */}
      {isInteracting && displayCategoryName && (
        <div
          role="tooltip"
          aria-live="polite"
          style={{
            top:
              touchYPercent !== null
                ? `${Math.max(
                    (0.5 / validCategories.length) * 100,
                    Math.min(
                      ((validCategories.length - 0.5) / validCategories.length) * 100,
                      touchYPercent * 100
                    )
                  )}%`
                : `${((activeIndex + 0.5) / validCategories.length) * 100}%`,
          }}
          className="absolute right-11 -translate-y-1/2 z-40 px-4 py-2 rounded-full bg-white/95 dark:bg-neutral-900/95 text-neutral-900 dark:text-white shadow-xl shadow-black/15 dark:shadow-black/50 backdrop-blur-md border border-neutral-200/90 dark:border-white/10 flex items-center justify-center transition-[top] duration-75 ease-out pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-95"
        >
          <span className="text-[13px] font-black font-display uppercase tracking-wide leading-none">
            {displayCategoryName}
          </span>
          {/* Triángulo apuntador hacia los puntos */}
          <span className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rotate-45 bg-white/95 dark:bg-neutral-900/95 border-r border-t border-neutral-200/90 dark:border-white/10" />
        </div>
      )}

      {/* Área táctil ergonómica y puntos flotantes limpios (sin fondo contenedor) */}
      <div
        ref={navContainerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative flex flex-col items-center justify-between py-1 px-1 cursor-grab active:cursor-grabbing transition-transform duration-200 select-none"
        style={{
          minHeight: `${Math.max(160, validCategories.length * 28)}px`,
        }}
      >
        {validCategories.map((cat, idx) => {
          const isCurrent = idx === activeIndex;
          const distance = Math.abs(idx - activeIndex);

          let scaleClass = "scale-100";
          let heightClass = "h-1.5 w-1.5";
          let opacityClass = "opacity-50";

          if (isInteracting) {
            if (distance === 0) {
              scaleClass = "scale-125";
              heightClass = "h-5 w-2 bg-brand-primary";
              opacityClass = "opacity-100";
            } else if (distance === 1) {
              scaleClass = "scale-110";
              heightClass = "h-2 w-2";
              opacityClass = "opacity-75";
            } else {
              heightClass = "h-1.5 w-1.5";
              opacityClass = "opacity-40";
            }
          } else {
            if (isCurrent) {
              scaleClass = "scale-110";
              heightClass = "h-4 w-1.5 bg-brand-primary";
              opacityClass = "opacity-100";
            } else {
              heightClass = "h-1.5 w-1.5 bg-neutral-400 dark:bg-neutral-500";
              opacityClass = "opacity-50";
            }
          }

          return (
            <div key={cat.name} className="flex items-center justify-center py-1 w-full">
              <div
                className={`rounded-full transition-all duration-200 ease-out will-change-transform ${heightClass} ${scaleClass} ${opacityClass} ${
                  isCurrent
                    ? "bg-brand-primary shadow-xs shadow-brand-primary/50"
                    : "bg-neutral-500 dark:bg-neutral-400"
                }`}
              />
            </div>
          );
        })}
      </div>
    </aside>
  );
}
