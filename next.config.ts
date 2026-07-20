import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A lockfile in the user's home directory otherwise makes Next infer the
  // wrong workspace root.
  turbopack: {
    root: __dirname,
  },
  images: {
    // Product photography is served from public/media by default. Add remote
    // hosts here when moving to an image CDN — see src/config/media.ts.
    remotePatterns: [],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
