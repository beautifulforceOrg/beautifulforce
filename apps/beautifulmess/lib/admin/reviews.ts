import { db } from "@storeforge/db";

export async function listReviews() {
  return db.review.findMany({
    orderBy: { createdAt: "desc" },
    include: { product: { select: { name: true, slug: true } }, customer: { select: { email: true, name: true } } },
  });
}

export async function deleteReview(id: string): Promise<void> {
  await db.review.delete({ where: { id } });
}
