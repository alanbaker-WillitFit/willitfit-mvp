/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Independent `npm run type-check` is the release gate; avoid Next generated-route type races during bundle generation.
  typescript: { ignoreBuildErrors: true },
  // Keep metadata in <head> for HTML-limited and AI crawlers.
  htmlLimitedBots: /.*/,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  experimental: {
    optimizePackageImports: [],
  },
};

module.exports = nextConfig;
