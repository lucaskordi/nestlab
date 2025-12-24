import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
    };
    return config;
  },
  reactStrictMode: false,
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
