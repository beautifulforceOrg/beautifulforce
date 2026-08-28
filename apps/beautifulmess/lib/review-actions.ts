"use server";

import { revalidatePath } from "next/cache";
import { db } from "@storeforge/db";
import { getSessionCustomerId } from "./auth";

export interface SubmitReviewResult {
  error?: string;
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
  const comment = String(formData.get("comment") ?? "").trim();

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

  revalidatePath(`/products/${productSlug}`);
  return {};
}
