"use client";

import React, { useMemo } from "react";
import { useCurrentTenantQuery } from "../hooks/useTenantQueries";
import { WhatsAppIcon } from "@/shared/components/WhatsAppIcon";

export function buildWhatsAppUrl(
  phone?: string | null,
  brandName?: string | null
): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("0")) {
    digits = "593" + digits.slice(1);
  } else if (!digits.startsWith("593") && digits.length === 9) {
    digits = "593" + digits;
  }
  const text = `¡Hola ${brandName || "Restaurante"}! Deseo consultar el menú y realizar un pedido.`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function FloatingWhatsAppButton() {
  const { data: tenant } = useCurrentTenantQuery();

  const phone = tenant?.contactPhone || tenant?.branches?.[0]?.phone;
  const brandName = tenant?.name || "el restaurante";

  const whatsappHref = useMemo(
    () => buildWhatsAppUrl(phone, brandName),
    [phone, brandName]
  );

  if (!whatsappHref) return null;

  return (
    <aside
      aria-label="Contacto por WhatsApp"
      className="fixed bottom-[68px] right-3.5 sm:bottom-6 sm:right-6 z-40 select-none print:hidden"
    >
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Chatear por WhatsApp con ${brandName}`}
        title={`Chatear por WhatsApp con ${brandName}`}
        className="group flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-full shadow-lg hover:shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 focus:outline-hidden focus:ring-4 focus:ring-[#25D366]/40 cursor-pointer shrink-0"
      >
        <WhatsAppIcon className="w-6 h-6 sm:w-7 sm:h-7" />
      </a>
    </aside>
  );
}

