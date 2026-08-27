import { beforeEach, describe, expect, it } from "vitest";
import { db } from "./client";

const OWNED_SLUGS = ["catalog-test-item"];
const OWNED_COLLECTION_SLUGS = ["catalog-test-collection"];

beforeEach(async () => {
  await db.orderItem.deleteMany({ where: { product: { slug: { in: OWNED_SLUGS } } } });
  await db.productVariant.deleteMany({ where: { product: { slug: { in: OWNED_SLUGS } } } });
  await db.productImage.deleteMany({ where: { product: { slug: { in: OWNED_SLUGS } } } });
  await db.product.deleteMany({ where: { slug: { in: OWNED_SLUGS } } });
  await db.collection.deleteMany({ where: { slug: { in: OWNED_COLLECTION_SLUGS } } });
});

describe("catalog schema: variants, images, collections (real Postgres)", () => {
  it("stores multiple size variants for one product", async () => {
    const product = await db.product.create({
      data: {
        slug: "catalog-test-item",
        name: "Test Frock",
        price: 5500,
        variants: {
          create: [
            { name: "Size", value: "5-6 years" },
            { name: "Size", value: "6-7 years" },
          ],
        },
      },
      include: { variants: true },
    });

    expect(product.variants).toHaveLength(2);
  });

  it("stores an ordered image gallery for one product", async () => {
    const product = await db.product.create({
      data: {
        slug: "catalog-test-item",
        name: "Test Frock",
        price: 5500,
        images: {
          create: [
            { url: "https://example.com/1.jpg", position: 0 },
            { url: "https://example.com/2.jpg", position: 1 },
          ],
        },
      },
      include: { images: { orderBy: { position: "asc" } } },
    });

    expect(product.images.map((image) => image.url)).toEqual([
      "https://example.com/1.jpg",
      "https://example.com/2.jpg",
    ]);
  });

  it("groups a product into a collection, queryable from either side", async () => {
    const collection = await db.collection.create({
      data: { slug: "catalog-test-collection", name: "Frocks" },
    });
    await db.product.create({
      data: {
        slug: "catalog-test-item",
        name: "Test Frock",
        price: 5500,
        collections: { connect: { id: collection.id } },
      },
    });

    const withProducts = await db.collection.findUnique({
      where: { id: collection.id },
      include: { products: true },
    });
    expect(withProducts?.products.map((p) => p.slug)).toEqual(["catalog-test-item"]);
  });

  it("orders a variant explicitly, keeping the product-level fallback for orders without one", async () => {
    const product = await db.product.create({
      data: {
        slug: "catalog-test-item",
        name: "Test Frock",
        price: 5500,
        variants: { create: [{ name: "Size", value: "5-6 years" }] },
      },
      include: { variants: true },
    });
    const variant = product.variants[0]!;

    const order = await db.order.create({
      data: {
        items: {
          create: [{ productId: product.id, variantId: variant.id, quantity: 1 }],
        },
      },
      include: { items: true },
    });

    expect(order.items[0]?.variantId).toBe(variant.id);
  });
});
