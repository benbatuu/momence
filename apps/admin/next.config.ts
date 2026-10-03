import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  // next image hostname cdn.ompilates.com
  images: {
    domains: ['cdn.ompilates.com', 'pub-21571903c9a946378fd729ef92805ef2.r2.dev'],
  },
};

export default nextConfig;
