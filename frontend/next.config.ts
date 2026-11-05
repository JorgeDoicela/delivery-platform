import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
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
  async rewrites() {
    const backendUrl =
      process.env.INTERNAL_API_URL ||
      (process.env.NODE_ENV === "production" ? "http://backend:5005" : "http://localhost:5005");

    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [
        {
          source: "/api/:path*",
          destination: `${backendUrl}/api/:path*`,
        },
        {
          source: "/hubs/:path*",
          destination: `${backendUrl}/hubs/:path*`,
        },
      ],
    };
  },
  async redirects() {
    return [
      { source: "/r/:slug", destination: "/:slug", permanent: true },
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
