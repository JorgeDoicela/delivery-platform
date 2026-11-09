"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useCurrentTenantQuery } from "@/features/tenant";
import type { TenantStorefrontConfigDto } from "@/shared/types/api";

interface PromotionalBannersProps {
  tenant?: TenantStorefrontConfigDto | null;
}

export function PromotionalBanners({
  tenant: tenantProp,
}: PromotionalBannersProps = {}) {
  const { data: queryTenant } = useCurrentTenantQuery();
  const tenant = tenantProp ?? queryTenant;
  const banners = tenant?.promotionalBanners ?? [];

  if (banners.length === 0) return null;

  return (
    <section className="w-full py-1 sm:py-2">
      <div className="max-w-[1240px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-6">
        {banners.map((banner, idx) => {
          const isSlate = banner.themeVariant === "slate";
          return (
            <div
              key={`${banner.id}-${idx}`}
              className={`relative overflow-hidden rounded-xl sm:rounded-3xl p-3.5 sm:p-8 flex flex-col justify-between text-white shadow-sm sm:shadow-xl min-h-[125px] sm:min-h-[320px] group ${
                isSlate ? "bg-slate-950" : "bg-neutral-950"
              }`}
            >
              <div className="absolute inset-0 z-0">
                <Image
                  src={
                    banner.imageUrl ||
                    "/images/tenants/la-granjita/banners/promo-receta-tradicional.jpg"
                  }
                  alt={banner.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/20" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              </div>

              <div className="space-y-1 sm:space-y-3 relative z-10 max-w-[250px] xs:max-w-xs sm:max-w-lg">
                <h3 className="text-sm sm:text-3xl font-black uppercase tracking-tight leading-snug text-white drop-shadow-md font-display">
                  {banner.title}
                </h3>
                <p className="text-[10px] sm:text-sm text-white/90 leading-tight font-medium drop-shadow line-clamp-1 sm:line-clamp-none">
                  {banner.subtitle}
                </p>
              </div>

              <div className="pt-2 sm:pt-6 relative z-10">
                <Link
                  href={banner.ctaHref || "#catalogo"}
                  suppressHydrationWarning
                  className={`inline-flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-black uppercase tracking-wider px-3.5 py-1.5 sm:px-6 sm:py-3 rounded-full transition-all shadow-xs sm:shadow-md active:scale-95 hover:scale-105 ${
                    idx % 2 === 1
                      ? "bg-white hover:bg-neutral-100 text-brand-primary"
                      : "bg-brand-primary hover:bg-brand-primary-hover text-white"
                  }`}
                >
                  <span>{banner.ctaText || "Ver Más"}</span>
                  <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
