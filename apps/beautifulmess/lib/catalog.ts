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
        where: { isPublished: true },
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

// Postgres full-text search over name/description/tags, plus a plain
// substring match on SKU (tsvector tokenizing splits "BM-GALAXY-042" into
// separate lexemes, which plainto_tsquery's AND-of-words semantics
// wouldn't match well against a search for just part of that code).
// $queryRaw is used with a tagged template (parameterized, never string-
// interpolated) -- never $queryRawUnsafe, per this repo's rules.
// `description` is raw HTML (see Product.description's comment) so it's
// stripped of tags before indexing, otherwise markup would pollute the
// tsvector. Ranked by ts_rank so a name match outranks an incidental tag
// match; results are then re-fetched through Prisma (for the same
// images/variants shape every other catalog query returns) and put back
// in rank order, since `findMany({ where: { id: { in } } })` doesn't
// preserve the `in` list's order.
export async function searchProducts(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const ranked = await db.$queryRaw<{ id: string }[]>`
    SELECT id FROM "Product"
    WHERE "isPublished" = true
    AND (
      to_tsvector('english',
        coalesce(name, '') || ' ' ||
        regexp_replace(coalesce(description, ''), '<[^>]*>', ' ', 'g') || ' ' ||
        coalesce(tags, '')
      ) @@ plainto_tsquery('english', ${trimmed})
      OR sku ILIKE ${"%" + trimmed + "%"}
    )
    ORDER BY ts_rank(
      to_tsvector('english',
        coalesce(name, '') || ' ' ||
        regexp_replace(coalesce(description, ''), '<[^>]*>', ' ', 'g') || ' ' ||
        coalesce(tags, '')
      ),
      plainto_tsquery('english', ${trimmed})
    ) DESC
    LIMIT 24
  `;
  if (ranked.length === 0) return [];

  const products = await db.product.findMany({
    where: { id: { in: ranked.map((r) => r.id) } },
    include: { images: { orderBy: { position: "asc" }, take: 2 }, variants: { select: { stockQty: true } } },
  });
  const byId = new Map(products.map((p) => [p.id, p]));
  return ranked.map((r) => byId.get(r.id)).filter((p): p is NonNullable<typeof p> => p !== undefined);
}

export async function getFeaturedProducts(limit = 8) {
  return db.product.findMany({
    where: { isPublished: true },
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
    where: { slug, isPublished: true },
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
      isPublished: true,
      id: { not: productId },
      collections: { some: { id: { in: collectionIds } } },
    },
    take: limit,
    include: { images: { orderBy: { position: "asc" }, take: 1 }, variants: { select: { stockQty: true } } },
  });
}

// A single product from a *different* collection -- the real site's
// "Complete the Look" (e.g. a dress paired with a bag). Same caveat as
// above: a heuristic, since no real outfit-pairing data exists to migrate.
export async function getCompleteTheLook(productId: string, collectionIds: string[]) {
  const where =
    collectionIds.length > 0
      ? { isPublished: true, id: { not: productId }, collections: { none: { id: { in: collectionIds } } } }
      : { isPublished: true, id: { not: productId } };

  return db.product.findFirst({
    where,
    include: { images: { orderBy: { position: "asc" }, take: 1 }, variants: { select: { stockQty: true } } },
  });
}
