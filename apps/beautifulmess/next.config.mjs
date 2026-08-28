/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@storeforge/ui"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.shopify.com" },
      // The client's own logo and founder photo, hosted on their live
      // site's CDN -- used directly rather than re-hosting a copy.
      { protocol: "https", hostname: "beautifulmess.in" },
    ],
  },
};

export default nextConfig;
