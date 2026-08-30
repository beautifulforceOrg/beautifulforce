import { db } from "@storeforge/db";
import { NextRequest } from "next/server";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { getCollectionBySlug } from "../../../../../lib/catalog";
import { filterAndSortProducts } from "../../../../../lib/product-list";
import { serializeProductSummary } from "../../../../../lib/mobile-serialize";
import { GET } from "./route";

const COLLECTION_SLUG = "mobile-api-test-collection";

async function cleanup() {
  await db.product.deleteMany({ where: { slug: { startsWith: "mobile-api-test-" } } });
  await db.collection.deleteMany({ where: { slug: COLLECTION_SLUG } });
}

beforeEach(async () => {
  await cleanup();
  await db.collection.create({
    data: {
      slug: COLLECTION_SLUG,
      name: "Mobile API Test Collection",
      products: {
        create: [
          {
            slug: "mobile-api-test-zebra-top",
            name: "Zebra Top",
            price: 100000,
            images: { create: [{ url: "https://example.com/zebra.jpg" }] },
            variants: { create: [{ name: "Size", value: "M", stockQty: 5 }] },
          },
          {
            slug: "mobile-api-test-apple-skirt",
            name: "Apple Skirt",
            price: 50000,
            images: { create: [{ url: "https://example.com/apple.jpg" }] },
            variants: { create: [{ name: "Size", value: "M", stockQty: 0 }] },
          },
        ],
      },
    },
  });
});

afterAll(cleanup);

describe("GET /api/mobile/collections/[collectionSlug]", () => {
  it("returns the same products, in the same order, that the web PLP's own getCollectionBySlug + filterAndSortProducts produce for identical filters", async () => {
    const request = new NextRequest(
      `http://localhost/api/mobile/collections/${COLLECTION_SLUG}?sort=price-ascending&availability=in-stock`
    );
    const response = await GET(request, { params: Promise.resolve({ collectionSlug: COLLECTION_SLUG }) });
    const body = await response.json();

    const collection = await getCollectionBySlug(COLLECTION_SLUG);
    const expectedProducts = filterAndSortProducts(collection!.products, {
      sort: "price-ascending",
      availability: "in-stock",
    }).map(serializeProductSummary);

    expect(body.products).toEqual(expectedProducts);
    // Sanity check on the fixture itself: the sold-out skirt is excluded.
    expect(body.products.map((p: { slug: string }) => p.slug)).toEqual(["mobile-api-test-zebra-top"]);
  });

  it("404s for an unknown collection slug", async () => {
    const request = new NextRequest("http://localhost/api/mobile/collections/does-not-exist");
    const response = await GET(request, { params: Promise.resolve({ collectionSlug: "does-not-exist" }) });
    expect(response.status).toBe(404);
  });
});
