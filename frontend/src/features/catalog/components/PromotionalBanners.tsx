"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useCurrentTenantQuery } from "@/features/tenant";
import { FALLBACK_TENANT_CONFIGS } from "@/features/tenant/store/useTenantStore";

export function PromotionalBanners() {
  const { data: tenant } = useCurrentTenantQuery();
  const banners =
    tenant?.promotionalBanners && tenant.promotionalBanners.length > 0
      ? tenant.promotionalBanners
      : FALLBACK_TENANT_CONFIGS["la-granjita"].promotionalBanners;

  if (banners.length === 0) return null;

  return (
    <section className="w-full py-2">
      <div className="max-w-[1240px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {banners.map((banner, idx) => {
          const isSlate = banner.themeVariant === "slate";
          return (
            <div
              key={`${banner.id}-${idx}`}
              className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 flex flex-col justify-between text-white shadow-lg min-h-[280px] sm:min-h-[320px] group ${
                isSlate
                  ? "bg-slate-950 border border-slate-300/20"
                  : "bg-neutral-950 border border-white/20"
              }`}
            >
              <div className="absolute inset-0 z-0">
                <Image
                  src={
                    banner.imageUrl ||
                    "/images/banners/promo-receta-tradicional.jpg"
                  }
                  alt={banner.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/20" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              </div>

              <div className="space-y-3 relative z-10 max-w-md sm:max-w-lg">
                <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight leading-tight text-white drop-shadow-md font-display">
                  {banner.title}
                </h3>
                <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-medium drop-shadow">
                  {banner.subtitle}
                </p>
              </div>

              <div className="pt-6 relative z-10">
                <Link
                  href={banner.ctaHref || "/catalogo"}
                  className={`inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider px-6 py-3 rounded-full transition-all shadow-md active:scale-95 hover:scale-105 ${
                    idx % 2 === 1
                      ? "bg-white hover:bg-neutral-100 text-brand-primary"
                      : "bg-brand-primary hover:bg-brand-primary-hover text-white"
                  }`}
                >
                  <span>{banner.ctaText || "Ver Más"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
