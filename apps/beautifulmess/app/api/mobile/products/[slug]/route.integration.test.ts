import { db } from "@storeforge/db";
import { NextRequest } from "next/server";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createSessionToken } from "../../../../../lib/session-token";
import { GET } from "./route";

const SLUG = "mobile-product-detail-test";
const CUSTOMER_EMAIL = "mobile-product-detail-test@example.com";

let productId: string;
let customerId: string;

async function cleanup() {
  await db.review.deleteMany({ where: { product: { slug: SLUG } } });
  await db.wishlistItem.deleteMany({ where: { product: { slug: SLUG } } });
  await db.product.deleteMany({ where: { slug: SLUG } });
  await db.customer.deleteMany({ where: { email: CUSTOMER_EMAIL } });
}

beforeEach(async () => {
  await cleanup();
  const customer = await db.customer.create({ data: { email: CUSTOMER_EMAIL } });
  const product = await db.product.create({
    data: {
      slug: SLUG,
      name: "Mobile Product Detail Test Frock",
      description: "<p>A lovely frock.</p>",
      price: 250000,
      images: { create: [{ url: "https://example.com/a.jpg", position: 0 }] },
      variants: { create: [{ name: "Size", value: "M", stockQty: 3 }] },
    },
  });
  productId = product.id;
  customerId = customer.id;
});

afterAll(cleanup);

function detailRequest(authenticated = false): NextRequest {
  return new NextRequest(`http://localhost/api/mobile/products/${SLUG}`, {
    headers: authenticated ? { authorization: `Bearer ${createSessionToken(customerId)}` } : {},
  });
}

describe("GET /api/mobile/products/[slug]", () => {
  it("returns full product detail: images, variants, description, empty reviews", async () => {
    const response = await GET(detailRequest(), { params: Promise.resolve({ slug: SLUG }) });
    const body = await response.json();

    expect(body.name).toBe("Mobile Product Detail Test Frock");
    expect(body.description).toBe("<p>A lovely frock.</p>");
    expect(body.images).toEqual(["https://example.com/a.jpg"]);
    expect(body.variants).toEqual([{ id: expect.any(String), name: "Size", value: "M", price: null, inStock: true }]);
    expect(body.inStock).toBe(true);
    expect(body.ratingSummary).toEqual({ average: 0, count: 0 });
    expect(body.reviews).toEqual([]);
    expect(body.hasReviewedAlready).toBe(false);
    expect(body.wishlisted).toBe(false);
  });

  it("reflects an existing review and wishlist state for the authenticated customer", async () => {
    await db.review.create({ data: { customerId, productId, rating: 5, comment: "Beautiful!" } });
    await db.wishlistItem.create({ data: { customerId, productId } });

    const response = await GET(detailRequest(true), { params: Promise.resolve({ slug: SLUG }) });
    const body = await response.json();

    expect(body.ratingSummary).toEqual({ average: 5, count: 1 });
    expect(body.reviews).toEqual([
      { id: expect.any(String), rating: 5, comment: "Beautiful!", customerName: null, createdAt: expect.any(String) },
    ]);
    expect(body.hasReviewedAlready).toBe(true);
    expect(body.wishlisted).toBe(true);
  });

  it("404s for an unknown slug", async () => {
    const response = await GET(new NextRequest("http://localhost/api/mobile/products/does-not-exist"), {
      params: Promise.resolve({ slug: "does-not-exist" }),
    });
    expect(response.status).toBe(404);
  });
});
