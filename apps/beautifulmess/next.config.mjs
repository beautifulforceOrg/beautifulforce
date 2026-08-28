/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@storeforge/ui"],
  images: {
    remotePatterns: [
      // Every image was migrated off the client's Shopify CDN onto our
      // own ImageKit account (scripts/migrate-images-to-imagekit.ts) --
      // the storefront no longer depends on beautifulmess.in staying up.
      { protocol: "https", hostname: "ik.imagekit.io" },
    ],
  },
};

export default nextConfig;
