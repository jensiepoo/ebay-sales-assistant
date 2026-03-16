import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mark native modules as external for server-side only
  serverExternalPackages: ["keytar", "better-sqlite3", "playwright"],

  // Webpack config for native modules
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Don't bundle native modules
      config.externals = config.externals || [];
      config.externals.push("keytar", "better-sqlite3");
    }
    return config;
  },
};

export default nextConfig;
