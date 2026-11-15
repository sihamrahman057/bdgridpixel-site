import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components + cookies() in auth caused intermittent InvariantError on
  // admin sign-in in development; keep the panel on classic dynamic rendering.
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
