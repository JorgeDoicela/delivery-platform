import { StorefrontCustomizerView } from "@/features/tenant/components/StorefrontCustomizerView";

export const metadata = {
  title: "Personalización de Marca & Landing | Panel Operativo",
  description:
    "Configuración multi-tenant de identidad visual, carrusel Hero, promociones, tarifas y datos bancarios.",
};

export default function PersonalizacionStorefrontPage() {
  return <StorefrontCustomizerView />;
}

