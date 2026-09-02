import { db } from "@storeforge/db";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { getServerCart, saveServerCart } from "./cart-sync";

const EMAIL = "cart-sync-test-customer@example.com";
const SLUG = "cart-sync-test-product";
const OTHER_SLUG = "cart-sync-test-product-2";

let customerId: string;
let productId: string;
let variantId: string;
let otherProductId: string;

async function cleanup() {
  await db.customer.deleteMany({ where: { email: EMAIL } });
  await db.product.deleteMany({ where: { slug: { in: [SLUG, OTHER_SLUG] } } });
}

beforeEach(async () => {
  await cleanup();
  const customer = await db.customer.create({ data: { email: EMAIL } });
  customerId = customer.id;

  const product = await db.product.create({
    data: {
      slug: SLUG,
      name: "Cart Sync Test Product",
      price: 5000,
      variants: { create: { name: "Size", value: "M", price: 5500 } },
    },
    include: { variants: true },
  });
  productId = product.id;
  variantId = product.variants[0]!.id;

  const otherProduct = await db.product.create({
    data: { slug: OTHER_SLUG, name: "Cart Sync Test Product 2", price: 2000 },
  });
  otherProductId = otherProduct.id;
});

afterAll(cleanup);

describe("getServerCart / saveServerCart", () => {
  it("returns an empty cart when nothing has been saved", async () => {
    expect(await getServerCart(customerId)).toEqual([]);
  });

  it("saves and reads back cart lines, joining live product/variant data", async () => {
    await saveServerCart(customerId, [
      { productId, variantId, name: "stale name -- ignored", price: 1, quantity: 2 },
    ]);

    const cart = await getServerCart(customerId);
    expect(cart).toEqual([
      {
        productId,
        variantId,
        variantLabel: "M",
        name: "Cart Sync Test Product",
        price: 5500, // the variant's price override, not the product's base price
        quantity: 2,
        giftRecipientEmail: undefined,
        giftRecipientName: undefined,
        giftMessage: undefined,
      },
    ]);
  });

  it("falls back to the product's price when the line has no variant", async () => {
    await saveServerCart(customerId, [{ productId: otherProductId, name: "x", price: 1, quantity: 1 }]);
    const cart = await getServerCart(customerId);
    expect(cart[0]).toMatchObject({ price: 2000, variantId: undefined, variantLabel: undefined });
  });

  it("preserves gift-recipient fields", async () => {
    await saveServerCart(customerId, [
      {
        productId: otherProductId,
        name: "x",
        price: 1,
        quantity: 1,
        giftRecipientEmail: "friend@example.com",
        giftRecipientName: "A Friend",
        giftMessage: "Happy birthday!",
      },
    ]);
    const cart = await getServerCart(customerId);
    expect(cart[0]).toMatchObject({
      giftRecipientEmail: "friend@example.com",
      giftRecipientName: "A Friend",
      giftMessage: "Happy birthday!",
    });
  });

  it("replaces the entire cart on a second save rather than appending", async () => {
    await saveServerCart(customerId, [{ productId, variantId, name: "x", price: 1, quantity: 1 }]);
    await saveServerCart(customerId, [{ productId: otherProductId, name: "x", price: 1, quantity: 3 }]);

    const cart = await getServerCart(customerId);
    expect(cart).toHaveLength(1);
    expect(cart[0]).toMatchObject({ productId: otherProductId, quantity: 3 });
  });

  it("clears the cart when saved with an empty line list", async () => {
    await saveServerCart(customerId, [{ productId, name: "x", price: 1, quantity: 1 }]);
    await saveServerCart(customerId, []);
    expect(await getServerCart(customerId)).toEqual([]);
  });
});
