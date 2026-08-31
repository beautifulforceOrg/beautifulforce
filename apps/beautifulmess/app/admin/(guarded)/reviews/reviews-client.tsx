"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { DataTable, useToast } from "@storeforge/ui";
import type { listReviews } from "../../../../lib/admin/reviews";
import { deleteReviewAction } from "./actions";

type Review = Awaited<ReturnType<typeof listReviews>>[number];

export function ReviewsClient({ initialReviews }: { initialReviews: Review[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string) {
    if (!confirm("Delete this review?")) return;
    startTransition(async () => {
      await deleteReviewAction(id);
      showToast("Review deleted.");
      router.refresh();
    });
  }

  return (
    <main>
      <h2 className="font-heading mb-6 text-2xl uppercase text-foreground">Reviews</h2>
      <DataTable
        rowKey={(review) => review.id}
        rows={initialReviews}
        columns={[
          { header: "Product", cell: (review) => review.product.name },
          { header: "Customer", cell: (review) => review.customer.name ?? review.customer.email },
          { header: "Rating", cell: (review) => `${review.rating}/5` },
          { header: "Comment", cell: (review) => review.comment },
          {
            header: "",
            cell: (review) => (
              <button
                type="button"
                onClick={() => handleDelete(review.id)}
                disabled={isPending}
                className="text-muted underline"
              >
                Delete
              </button>
            ),
          },
        ]}
        emptyMessage="No reviews yet."
      />
    </main>
  );
}
