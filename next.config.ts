import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    /** Brochure API fallback + large FormData through dev proxy (default is 10MB). */
    proxyClientMaxBodySize: "55mb",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "logo.clearbit.com",
      },
    ],
  },
};

export default nextConfig;
