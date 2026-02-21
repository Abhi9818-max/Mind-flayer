import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: 'export', // Disabled for web build (dynamic routes support)
  images: {
    unoptimized: true
  }
};

export default nextConfig;
