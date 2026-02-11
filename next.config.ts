import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Cloudflare Pages 不支持 Image Optimization
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
