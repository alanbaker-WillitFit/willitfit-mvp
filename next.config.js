/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
