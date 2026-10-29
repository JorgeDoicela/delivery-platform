"use client";

import React, {
  forwardRef,
  useRef,
  useState,
  useEffect,
  useCallback,
  useImperativeHandle,
} from "react";

export type ScrollAreaOrientation = "vertical" | "horizontal" | "both";
export type ScrollAreaVariant = "default" | "brand" | "dark" | "subtle" | "none";

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  orientation?: ScrollAreaOrientation;
  variant?: ScrollAreaVariant;
  maxHeight?: string | number;
  maxWidth?: string | number;
  viewportClassName?: string;
  scrollShadows?: boolean;
}

export interface ScrollAreaHandle {
  viewport: HTMLDivElement | null;
  scrollToTop: (smooth?: boolean) => void;
  scrollToBottom: (smooth?: boolean) => void;
  scrollTo: (options: ScrollToOptions) => void;
}

const VARIANT_CLASSES: Record<ScrollAreaVariant, string> = {
  default: "custom-scrollbar",
  brand: "scrollbar-brand",
  dark: "scrollbar-dark",
  subtle: "scrollbar-subtle",
  none: "scrollbar-none",
};

/**
 * ScrollArea - Componente reutilizable de desplazamiento ergonómico
 * Reemplaza las barras nativas del sistema operativo por scrollbars estilizados
 * según la paleta e identidad de La Granjita Asadero.
 */
export const ScrollArea = forwardRef<ScrollAreaHandle, ScrollAreaProps>(
  (
    {
      children,
      orientation = "vertical",
      variant = "default",
      maxHeight,
      maxWidth,
      className = "",
      viewportClassName = "",
      scrollShadows = false,
      ...props
    },
    ref
  ) => {
    const viewportRef = useRef<HTMLDivElement>(null);
    const [showTopShadow, setShowTopShadow] = useState(false);
    const [showBottomShadow, setShowBottomShadow] = useState(false);
    const [showLeftShadow, setShowLeftShadow] = useState(false);
    const [showRightShadow, setShowRightShadow] = useState(false);

    // Exponer API imperativa para control de desplazamiento
    useImperativeHandle(ref, () => ({
      viewport: viewportRef.current,
      scrollToTop: (smooth = true) => {
        viewportRef.current?.scrollTo({
          top: 0,
          behavior: smooth ? "smooth" : "auto",
        });
      },
      scrollToBottom: (smooth = true) => {
        if (viewportRef.current) {
          viewportRef.current.scrollTo({
            top: viewportRef.current.scrollHeight,
            behavior: smooth ? "smooth" : "auto",
          });
        }
      },
      scrollTo: (options: ScrollToOptions) => {
        viewportRef.current?.scrollTo(options);
      },
    }));

    const updateShadows = useCallback(() => {
      const el = viewportRef.current;
      if (!el || !scrollShadows) return;

      const { scrollTop, scrollHeight, clientHeight, scrollLeft, scrollWidth, clientWidth } = el;

      if (orientation === "vertical" || orientation === "both") {
        setShowTopShadow(scrollTop > 4);
        setShowBottomShadow(scrollTop + clientHeight < scrollHeight - 4);
      }

      if (orientation === "horizontal" || orientation === "both") {
        setShowLeftShadow(scrollLeft > 4);
        setShowRightShadow(scrollLeft + clientWidth < scrollWidth - 4);
      }
    }, [scrollShadows, orientation]);

    useEffect(() => {
      const el = viewportRef.current;
      if (!el || !scrollShadows) return;

      updateShadows();
      const handleScroll = () => updateShadows();
      el.addEventListener("scroll", handleScroll, { passive: true });

      // Resize observer para detectar cambios en contenido dinámico
      const resizeObserver = new ResizeObserver(() => updateShadows());
      resizeObserver.observe(el);

      return () => {
        el.removeEventListener("scroll", handleScroll);
        resizeObserver.disconnect();
      };
    }, [scrollShadows, updateShadows]);

    // Clases de desbordamiento según orientación
    const overflowClasses =
      orientation === "vertical"
        ? "overflow-y-auto overflow-x-hidden"
        : orientation === "horizontal"
        ? "overflow-x-auto overflow-y-hidden"
        : "overflow-auto";

    const variantClass = VARIANT_CLASSES[variant] || VARIANT_CLASSES.default;

    const style: React.CSSProperties = {
      ...(maxHeight ? { maxHeight } : {}),
      ...(maxWidth ? { maxWidth } : {}),
      ...props.style,
    };

    return (
      <div
        className={`relative group ${className}`.trim()}
        data-scroll-area
        data-variant={variant}
        data-orientation={orientation}
        {...props}
        style={style}
      >
        {/* Contenedor desplazable con scrollbar estilizado */}
        <div
          ref={viewportRef}
          className={`h-full w-full ${overflowClasses} ${variantClass} ${viewportClassName}`.trim()}
          style={{ maxHeight, maxWidth }}
        >
          {children}
        </div>

        {/* Sombras de desbordamiento progresivas opcionales */}
        {scrollShadows && (
          <>
            {showTopShadow && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-black/10 to-transparent transition-opacity duration-200 z-10"
              />
            )}
            {showBottomShadow && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-black/10 to-transparent transition-opacity duration-200 z-10"
              />
            )}
            {showLeftShadow && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-black/10 to-transparent transition-opacity duration-200 z-10"
              />
            )}
            {showRightShadow && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-black/10 to-transparent transition-opacity duration-200 z-10"
              />
            )}
          </>
        )}
      </div>
    );
  }
);

ScrollArea.displayName = "ScrollArea";

