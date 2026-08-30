import { db } from "@storeforge/db";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createSessionToken } from "../../../../../../lib/session-token";
import { POST } from "./route";

const SLUG = "mobile-review-submit-test";
const CUSTOMER_EMAIL = "mobile-review-submit-test@example.com";

let productId: string;
let customerId: string;

async function cleanup() {
  await db.review.deleteMany({ where: { product: { slug: SLUG } } });
  await db.product.deleteMany({ where: { slug: SLUG } });
  await db.customer.deleteMany({ where: { email: CUSTOMER_EMAIL } });
}

beforeEach(async () => {
  await cleanup();
  const customer = await db.customer.create({ data: { email: CUSTOMER_EMAIL } });
  const product = await db.product.create({ data: { slug: SLUG, name: "Mobile Review Submit Test Product", price: 100000 } });
  productId = product.id;
  customerId = customer.id;
});

afterAll(cleanup);

function reviewRequest(body: unknown, authenticated = true): Request {
  return new Request(`http://localhost/api/mobile/products/${SLUG}/reviews`, {
    method: "POST",
    headers: authenticated ? { authorization: `Bearer ${createSessionToken(customerId)}` } : {},
    body: JSON.stringify(body),
  });
}

describe("POST /api/mobile/products/[slug]/reviews", () => {
  it("creates a review for the authenticated customer", async () => {
    const response = await POST(reviewRequest({ rating: 4, comment: "Nice quality." }), {
      params: Promise.resolve({ slug: SLUG }),
    });
    expect(response.status).toBe(200);
    const review = await db.review.findUnique({ where: { customerId_productId: { customerId, productId } } });
    expect(review).toMatchObject({ rating: 4, comment: "Nice quality." });
  });

  it("401s with no Authorization header", async () => {
    const response = await POST(reviewRequest({ rating: 4, comment: "Nice." }, false), {
      params: Promise.resolve({ slug: SLUG }),
    });
    expect(response.status).toBe(401);
  });

  it("400s for an out-of-range rating", async () => {
    const response = await POST(reviewRequest({ rating: 9, comment: "Nice." }), { params: Promise.resolve({ slug: SLUG }) });
    expect(response.status).toBe(400);
  });

  it("404s for an unknown product slug", async () => {
    const response = await POST(reviewRequest({ rating: 4, comment: "Nice." }), {
      params: Promise.resolve({ slug: "does-not-exist" }),
    });
    expect(response.status).toBe(404);
  });
});
