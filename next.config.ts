import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/shared/i18n/request.ts");

/**
 * The backend returns absolute image URLs (venues, courts, sports). `next/image`
 * only optimizes remote images from hosts listed here, so the one that serves
 * them is configured through `ASSETS_BASE_URL` (a CDN in production, the client
 * web app's own `/public` in local development).
 */
const assetsUrl = new URL(process.env.ASSETS_BASE_URL || "http://localhost:3000");

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  experimental: {
    agentFeedback: true,
    agentUpgrade: "security",
    serverActions: {
      bodySizeLimit: "15mb",
    },
  },
  // `cacheComponents` / `partialPrefetching` (enabled by create-next-app) are OFF on purpose:
  // the locale comes from a cookie read in the root layout (next-intl, no URL prefix) and the
  // whole panel is authenticated, hence dynamic. With Cache Components the build fails with
  // "uncached or runtime data accessed outside <Suspense>". The Client app runs the same way.
  // Re-enable only together with a Suspense-based shell and a `use cache` strategy.
  cacheComponents: false,
  partialPrefetching: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: assetsUrl.protocol === "https:" ? "https" : "http",
        hostname: assetsUrl.hostname,
        port: assetsUrl.port,
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "4000",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.cloudfront.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.nivis.cloud",
        pathname: "/**",
      },
    ],
    // Since Next 16 the optimizer refuses to fetch private/loopback addresses.
    // Local development serves the demo images from localhost, so allow it
    // there only: in production the assets come from a public host.
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
  },
};

export default withNextIntl(nextConfig);
