import { db } from "@storeforge/db";
import { getSessionCustomerId } from "./auth";
import { getWishlistedProductIdsFor } from "./wishlist";

export async function getWishlistedProductIds(): Promise<string[]> {
  const customerId = await getSessionCustomerId();
  if (!customerId) return [];
  return getWishlistedProductIdsFor(customerId);
}

export async function getCollections() {
  return db.collection.findMany({ orderBy: { name: "asc" } });
}

export async function getCollectionBySlug(slug: string) {
  return db.collection.findUnique({
    where: { slug },
    include: {
      products: {
        include: {
          // take: 2, not 1 -- the catalog grid's hover-swap shows a
          // product's second real image, not a fabricated placeholder.
          images: { orderBy: { position: "asc" }, take: 2 },
          variants: { select: { stockQty: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

// Simple substring search over product names -- the real site's
// predictive-search endpoint needs its own indexed backend, which this
// storefront doesn't have; this covers the actual "find a product by
// name" use case with what the catalog already has.
export async function searchProducts(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return [];
  return db.product.findMany({
    where: { name: { contains: trimmed, mode: "insensitive" } },
    include: { images: { orderBy: { position: "asc" }, take: 2 } },
    take: 24,
  });
}

export async function getFeaturedProducts(limit = 8) {
  return db.product.findMany({
    take: limit,
    orderBy: { createdAt: "asc" },
    include: {
      images: { orderBy: { position: "asc" }, take: 2 },
      variants: { select: { stockQty: true } },
    },
  });
}

export async function getProductBySlug(slug: string) {
  return db.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { position: "asc" } },
      variants: true,
      collections: { select: { id: true } },
      reviews: {
        orderBy: { createdAt: "desc" },
        include: { customer: { select: { name: true } } },
      },
    },
  });
}

// Same-collection products, excluding the one being viewed -- the real
// site's "You may also like" section. There's no curated recommendation
// data in the migrated catalog (checked: the CSV's own
// complementary/related-product columns were empty for every product), so
// this is a same-category heuristic, not merchant-curated pairing.
export async function getYouMayAlsoLike(productId: string, collectionIds: string[], limit = 4) {
  if (collectionIds.length === 0) return [];
  return db.product.findMany({
    where: {
      id: { not: productId },
      collections: { some: { id: { in: collectionIds } } },
    },
    take: limit,
    include: { images: { orderBy: { position: "asc" }, take: 1 } },
  });
}

// A single product from a *different* collection -- the real site's
// "Complete the Look" (e.g. a dress paired with a bag). Same caveat as
// above: a heuristic, since no real outfit-pairing data exists to migrate.
export async function getCompleteTheLook(productId: string, collectionIds: string[]) {
  const where =
    collectionIds.length > 0
      ? { id: { not: productId }, collections: { none: { id: { in: collectionIds } } } }
      : { id: { not: productId } };

  return db.product.findFirst({
    where,
    include: { images: { orderBy: { position: "asc" }, take: 1 } },
  });
}
