/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@storeforge/ui"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "cdn.shopify.com" }],
  },
};

export default nextConfig;
