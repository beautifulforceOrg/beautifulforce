import { withSentryConfig } from "@sentry/nextjs/config";

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

// Safe with no Sentry account yet: without SENTRY_AUTH_TOKEN, the plugin
// skips source-map upload entirely (just a local no-op wrapper) rather
// than failing the build -- verified with a real local production build
// before this was committed (see docs/pending-actions.md for the
// one-time account-creation + DSN step this still needs from you).
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
});
