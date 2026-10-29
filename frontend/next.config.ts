import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Desactivar generacion automatica de AGENTS.md en la subcarpeta frontend
  agentRules: false,
  async redirects() {
    return [
      { source: "/checkout", destination: "/finalizar-pedido", permanent: true },
      { source: "/track", destination: "/rastreo", permanent: true },
      { source: "/track/:orderId", destination: "/rastreo/:orderId", permanent: true },
      { source: "/kitchen", destination: "/cocina", permanent: true },
      { source: "/admin/branches", destination: "/admin/sucursales", permanent: true },
      { source: "/admin/inventory", destination: "/admin/inventario", permanent: true },
      { source: "/active-delivery", destination: "/repartidor", permanent: true },
    ];
  },
};

export default nextConfig;
