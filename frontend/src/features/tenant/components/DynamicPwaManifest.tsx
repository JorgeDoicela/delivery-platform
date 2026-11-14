"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useCartStore } from "@/features/cart";

interface DynamicPwaManifestProps {
  slug?: string;
}

/**
 * Sincroniza dinamicamente la etiqueta <link rel="manifest"> en document.head
 * con el tenant y la sucursal seleccionada en tiempo de ejecucion.
 */
export function DynamicPwaManifest({ slug: explicitSlug }: DynamicPwaManifestProps = {}) {
  const params = useParams();
  const routeSlug = typeof params?.slug === "string" ? params.slug : "";
  const slug = explicitSlug || routeSlug;
  const selectedBranchId = useCartStore((s) => s.branchId);

  useEffect(() => {
    if (typeof document === "undefined" || !slug) return;

    const query = new URLSearchParams();
    query.set("slug", slug);
    if (selectedBranchId !== null && selectedBranchId !== undefined) {
      query.set("branch", String(selectedBranchId));
    }

    const queryString = query.toString();
    const manifestHref = `/manifest.json${queryString ? `?${queryString}` : ""}`;

    let manifestLink = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (manifestLink) {
      if (manifestLink.getAttribute("href") !== manifestHref) {
        manifestLink.setAttribute("href", manifestHref);
      }
    } else {
      manifestLink = document.createElement("link");
      manifestLink.setAttribute("rel", "manifest");
      manifestLink.setAttribute("href", manifestHref);
      document.head.appendChild(manifestLink);
    }
  }, [slug, selectedBranchId]);

  return null;
}
