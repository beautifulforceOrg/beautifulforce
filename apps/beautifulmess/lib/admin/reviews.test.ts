import { db } from "@storeforge/db";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { deleteReview, listReviews } from "./reviews";

const SLUG = "admin-reviews-test-product";
const EMAIL = "admin-reviews-test-customer@example.com";

let reviewId: string;

async function cleanup() {
  await db.review.deleteMany({ where: { product: { slug: SLUG } } });
  await db.product.deleteMany({ where: { slug: SLUG } });
  await db.customer.deleteMany({ where: { email: EMAIL } });
}

beforeEach(async () => {
  await cleanup();
  const product = await db.product.create({ data: { slug: SLUG, name: "Reviews Test Product", price: 1000 } });
  const customer = await db.customer.create({ data: { email: EMAIL } });
  const review = await db.review.create({
    data: { productId: product.id, customerId: customer.id, rating: 5, comment: "Great!" },
  });
  reviewId = review.id;
});

afterAll(cleanup);

describe("listReviews / deleteReview", () => {
  it("lists reviews with product and customer info", async () => {
    const reviews = await listReviews();
    const found = reviews.find((r) => r.id === reviewId);
    expect(found?.product.name).toBe("Reviews Test Product");
    expect(found?.customer.email).toBe(EMAIL);
  });

  it("deletes a review", async () => {
    await deleteReview(reviewId);
    expect(await db.review.findUnique({ where: { id: reviewId } })).toBeNull();
  });
});
