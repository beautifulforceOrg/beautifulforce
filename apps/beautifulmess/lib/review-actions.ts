"use server";

import { revalidatePath } from "next/cache";
import { getSessionCustomerId } from "./auth";
import { submitReviewFor, type SubmitReviewResult as SubmitReviewCoreResult } from "./review-submission";

export interface SubmitReviewResult extends SubmitReviewCoreResult {
  requiresLogin?: boolean;
}

export async function submitReview(
  productId: string,
  productSlug: string,
  formData: FormData
): Promise<SubmitReviewResult> {
  const customerId = await getSessionCustomerId();
  if (!customerId) {
    return { requiresLogin: true };
  }

  const rating = Number(formData.get("rating"));
  const comment = String(formData.get("comment") ?? "");
  const result = await submitReviewFor(customerId, productId, { rating, comment });
  if (!result.error) {
    revalidatePath(`/products/${productSlug}`);
  }
  return result;
}
