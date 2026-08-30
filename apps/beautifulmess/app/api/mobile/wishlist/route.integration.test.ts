import { db } from "@storeforge/db";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createSessionToken } from "../../../../lib/session-token";
import { GET, POST } from "./route";

const EMAIL = "mobile-wishlist-test@example.com";
const PRODUCT_SLUG = "mobile-wishlist-test-product";

let customerId: string;
let productId: string;
let authHeaders: Record<string, string>;

async function cleanup() {
  await db.wishlistItem.deleteMany({ where: { customer: { email: EMAIL } } });
  await db.customer.deleteMany({ where: { email: EMAIL } });
  await db.product.deleteMany({ where: { slug: PRODUCT_SLUG } });
}

beforeEach(async () => {
  await cleanup();
  const customer = await db.customer.create({ data: { email: EMAIL } });
  const product = await db.product.create({ data: { slug: PRODUCT_SLUG, name: "Mobile Wishlist Test Product", price: 1000 } });
  customerId = customer.id;
  productId = product.id;
  authHeaders = { authorization: `Bearer ${createSessionToken(customerId)}` };
});

afterAll(cleanup);

describe("GET/POST /api/mobile/wishlist", () => {
  it("401s with no Authorization header", async () => {
    const response = await GET(new Request("http://localhost/api/mobile/wishlist"));
    expect(response.status).toBe(401);
  });

  it("starts empty, then reflects a toggled-on product", async () => {
    const empty = await (await GET(new Request("http://localhost/api/mobile/wishlist", { headers: authHeaders }))).json();
    expect(empty.productIds).toEqual([]);

    const toggleResponse = await POST(
      new Request("http://localhost/api/mobile/wishlist", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ productId }),
      })
    );
    expect(await toggleResponse.json()).toEqual({ wishlisted: true });

    const after = await (await GET(new Request("http://localhost/api/mobile/wishlist", { headers: authHeaders }))).json();
    expect(after.productIds).toEqual([productId]);
  });

  it("400s a toggle with no productId", async () => {
    const response = await POST(
      new Request("http://localhost/api/mobile/wishlist", { method: "POST", headers: authHeaders, body: JSON.stringify({}) })
    );
    expect(response.status).toBe(400);
  });
});
