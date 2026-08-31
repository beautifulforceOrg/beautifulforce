"use server";

import { revalidatePath } from "next/cache";
import { requireAdminOrThrow } from "../../../../lib/admin/auth";
import { deleteReview } from "../../../../lib/admin/reviews";

export async function deleteReviewAction(id: string): Promise<void> {
  await requireAdminOrThrow();
  await deleteReview(id);
  revalidatePath("/admin/reviews");
}
