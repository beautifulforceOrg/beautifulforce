import type { MetadataRoute } from "next";
import { getCollections, getFeaturedProducts } from "../lib/catalog";

// Otherwise Next.js statically prerenders this route at build time, which
// needs a live DATABASE_URL -- not available in Vercel's build step here
// (only at runtime), and this broke the very first production deploy of
// this file. Rendering per-request instead avoids that entirely.
export const dynamic = "force-dynamic";

// NEXT_PUBLIC_SITE_URL falls back to the real production Vercel URL --
// this storefront has no custom domain configured yet (see CLAUDE.md's
// Isolation section: each storefront gets its own domain eventually).
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://beautifulforce-beautifulmess.vercel.app";

const STATIC_ROUTES = [
  "",
  "/shop",
  "/about",
  "/search",
  "/help/contact",
  "/help/careers",
  "/help/franchise",
  "/help/press",
  "/policies/privacy",
  "/policies/refund",
  "/policies/shipping",
  "/policies/terms",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [collections, products] = await Promise.all([
    getCollections(),
    // Products are added/removed one at a time in practice, not in the
    // thousands -- a single unpaginated fetch matches this storefront's
    // actual catalog size (see lib/catalog.ts's other unpaginated reads).
    getFeaturedProducts(1000),
  ]);

  return [
    ...STATIC_ROUTES.map((path) => ({ url: `${SITE_URL}${path}`, lastModified: new Date() })),
    ...collections.map((collection) => ({
      url: `${SITE_URL}/shop/${collection.slug}`,
      lastModified: new Date(),
    })),
    ...products.map((product) => ({
      url: `${SITE_URL}/products/${product.slug}`,
      lastModified: product.updatedAt,
    })),
  ];
}
