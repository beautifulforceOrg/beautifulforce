/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@storeforge/ui"],
  // Next's build-time file tracer can't see that Prisma loads its query
  // engine binary via a dynamically-computed path -- without this, the
  // engine file (present on disk after `prisma generate`) never gets
  // bundled into the deployed serverless function, and every DB call
  // fails at runtime with "could not locate the Query Engine". The
  // wildcard covers pnpm's hashed virtual-store folder name for
  // @prisma/client, which changes whenever its version changes.
  outputFileTracingIncludes: {
    "/": ["../../node_modules/.pnpm/@prisma+client@*/node_modules/.prisma/client/**/*"],
    "/**/*": ["../../node_modules/.pnpm/@prisma+client@*/node_modules/.prisma/client/**/*"],
  },
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
