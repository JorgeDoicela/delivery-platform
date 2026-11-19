"use client";

import React from "react";
import { FloatingPwaInstallButton } from "./FloatingPwaInstallButton";
import { FloatingWhatsAppButton } from "./FloatingWhatsAppButton";

export function FloatingStorefrontActions() {
  return (
    <aside
      aria-label="Acciones rápidas flotantes"
      className="fixed bottom-[68px] right-3.5 sm:bottom-6 sm:right-6 z-40 flex flex-col items-center gap-2.5 sm:gap-3 select-none print:hidden pointer-events-none"
    >
      <div className="pointer-events-auto">
        <FloatingPwaInstallButton />
      </div>
      <div className="pointer-events-auto">
        <FloatingWhatsAppButton isEmbedded />
      </div>
    </aside>
  );
}
