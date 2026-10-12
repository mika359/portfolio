import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static site: `npm run build` produces the `out/` folder (host anywhere).
  output: "export",
  images: { unoptimized: true },
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
