import { db } from "@storeforge/db";

export interface SubmitReviewInput {
  rating: number;
  comment: string;
}

export interface SubmitReviewResult {
  error?: string;
}

// The customerId-taking core of review submission, shared by the
// cookie-authenticated web Server Action (lib/review-actions.ts) and the
// Bearer-authenticated app/api/mobile/products/[slug]/reviews/route.ts --
// same "one function, two transport wrappers" pattern as checkout/wishlist.
export async function submitReviewFor(customerId: string, productId: string, input: SubmitReviewInput): Promise<SubmitReviewResult> {
  const { rating, comment: rawComment } = input;
  const comment = rawComment.trim();

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "Please choose a rating from 1 to 5." };
  }
  if (!comment) {
    return { error: "Please write a short review." };
  }

  await db.review.upsert({
    where: { customerId_productId: { customerId, productId } },
    update: { rating, comment },
    create: { customerId, productId, rating, comment },
  });

  return {};
}
