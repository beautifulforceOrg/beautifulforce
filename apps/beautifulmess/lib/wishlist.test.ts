import { db } from "@storeforge/db";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { getWishlistedProductIdsFor, toggleWishlistFor } from "./wishlist";

const CUSTOMER_EMAIL = "wishlist-test-customer@example.com";
const PRODUCT_SLUG = "wishlist-test-product";

let customerId: string;
let productId: string;

async function cleanup() {
  await db.wishlistItem.deleteMany({ where: { customer: { email: CUSTOMER_EMAIL } } });
  await db.customer.deleteMany({ where: { email: CUSTOMER_EMAIL } });
  await db.product.deleteMany({ where: { slug: PRODUCT_SLUG } });
}

beforeEach(async () => {
  await cleanup();
  const customer = await db.customer.create({ data: { email: CUSTOMER_EMAIL } });
  const product = await db.product.create({ data: { slug: PRODUCT_SLUG, name: "Wishlist Test Product", price: 1000 } });
  customerId = customer.id;
  productId = product.id;
});

afterAll(cleanup);

describe("toggleWishlistFor / getWishlistedProductIdsFor", () => {
  it("adds a product on first toggle and reports it in the list", async () => {
    const result = await toggleWishlistFor(customerId, productId);
    expect(result).toEqual({ wishlisted: true });
    expect(await getWishlistedProductIdsFor(customerId)).toEqual([productId]);
  });

  it("removes the product on a second toggle", async () => {
    await toggleWishlistFor(customerId, productId);
    const result = await toggleWishlistFor(customerId, productId);
    expect(result).toEqual({ wishlisted: false });
    expect(await getWishlistedProductIdsFor(customerId)).toEqual([]);
  });

  it("returns an empty list for a customer with no wishlist items", async () => {
    expect(await getWishlistedProductIdsFor(customerId)).toEqual([]);
  });
});
