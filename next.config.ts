import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "datafa.st",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "icons.duckduckgo.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "pbs.twimg.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "image.mux.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "source.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.google.com",
        pathname: "/s2/favicons",
      },
      {
        protocol: "https",
        hostname: "t0.gstatic.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.gstatic.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img.logo.dev",
        pathname: "/**",
      },
    ],
    // Allow unoptimized images for dynamic domain favicons
    unoptimized: false,
  },
  webpack: (config, { isServer }) => {
    // Fix for Mapbox GL
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }

    // Handle Mapbox GL worker files
    config.module.rules.push({
      test: /\.worker\.js$/,
      type: "asset/resource",
    });

    return config;
  },
  // Turbopack config - empty for now, webpack config above will be used with --webpack flag
  turbopack: {},
};

export default nextConfig;
