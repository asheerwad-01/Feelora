import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.scdn.co",
      },
      {
        protocol: "https",
        hostname: "mosaic.scdn.co",
      },
      {
        protocol: "https",
        hostname: "image-cdn-ak.spotifycdn.com",
      },
      {
        protocol: "https",
        hostname: "image-cdn-fa.spotifycdn.com",
      },
    ],
  },
  // Turbopack config (Next.js 16 default bundler)
  turbopack: {},
  // Suppress hydration warnings for Three.js canvas
  reactStrictMode: false,
  // Allow Turbopack development connections on loopback IP
  allowedDevOrigins: ['127.0.0.1', '192.168.1.4'],
};

export default nextConfig;
