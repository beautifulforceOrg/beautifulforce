"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { StarIcon } from "../../icons";
import { submitReview } from "../../../lib/review-actions";
import { summarizeRatings } from "../../../lib/reviews";

export interface ReviewItem {
  id: string;
  rating: number;
  comment: string;
  customer: { name: string | null };
}

function Stars({ value, size = "h-4 w-4" }: { value: number; size?: string }) {
  return (
    <div className="flex gap-0.5 text-brand" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon key={n} className={`${size} ${n <= Math.round(value) ? "" : "opacity-25"}`} />
      ))}
    </div>
  );
}

export function ReviewsSection({
  productId,
  productSlug,
  reviews,
  hasReviewedAlready,
}: {
  productId: string;
  productSlug: string;
  reviews: ReviewItem[];
  hasReviewedAlready: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(hasReviewedAlready);
  const [isPending, startTransition] = useTransition();
  const summary = summarizeRatings(reviews.map((r) => r.rating));
  // A ref, not state, so a second click arriving before React commits the
  // `isPending` update (the `disabled` prop lags one render behind a
  // synchronous double-click) is still caught immediately.
  const submitInFlight = useRef(false);

  function handleSubmit(formData: FormData) {
    if (submitInFlight.current) return;
    submitInFlight.current = true;
    setError(null);
    startTransition(async () => {
      const result = await submitReview(productId, productSlug, formData);
      if (result.requiresLogin) {
        router.push("/account/login");
        return;
      }
      if (result.error) {
        submitInFlight.current = false;
        setError(result.error);
        return;
      }
      setSubmitted(true);
      router.refresh();
    });
  }

  return (
    <section className="mx-auto mt-16 max-w-5xl px-6 pb-16" aria-label="Customer reviews">
      <h2 className="font-heading mb-6 text-center text-2xl uppercase text-foreground">Customer Reviews</h2>

      {summary.count > 0 ? (
        <div className="mb-8 flex flex-col items-center gap-1">
          <Stars value={summary.average} size="h-5 w-5" />
          <p className="text-sm text-muted">
            {summary.average} out of 5 &middot; {summary.count} review{summary.count === 1 ? "" : "s"}
          </p>
        </div>
      ) : (
        <div className="mb-8 flex flex-col items-center gap-1">
          <Stars value={0} size="h-5 w-5" />
          <p className="text-sm text-muted">Be the first to write a review</p>
        </div>
      )}

      {reviews.length > 0 ? (
        <ul className="mb-10 space-y-6">
          {reviews.map((review) => (
            <li key={review.id} className="border-b border-border pb-6">
              <Stars value={review.rating} />
              <p className="mt-2 text-sm text-foreground">{review.comment}</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-muted">{review.customer.name ?? "Verified customer"}</p>
            </li>
          ))}
        </ul>
      ) : null}

      {submitted ? (
        <p className="text-center text-sm text-muted">You&apos;ve reviewed this product. Thank you!</p>
      ) : (
        <form action={handleSubmit} className="mx-auto max-w-md space-y-3">
          <fieldset>
            <legend className="mb-2 text-sm font-medium uppercase text-foreground">Your rating</legend>
            <div className="flex gap-3">
              {[1, 2, 3, 4, 5].map((n) => (
                <label key={n} className="flex items-center gap-1 text-sm text-foreground">
                  <input type="radio" name="rating" value={n} required /> {n}
                </label>
              ))}
            </div>
          </fieldset>
          <textarea
            name="comment"
            required
            rows={3}
            placeholder="Share your experience with this product"
            className="w-full rounded-[var(--sf-radius,0.5rem)] border border-border px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted"
          />
          {error ? <p style={{ color: "#B91C1C" }} className="text-sm">{error}</p> : null}
          <button
            type="submit"
            disabled={isPending}
            className="rounded-[var(--sf-radius,0.5rem)] bg-brand px-6 py-2.5 text-sm font-medium uppercase text-brand-foreground disabled:opacity-50"
          >
            {isPending ? "Submitting..." : "Submit review"}
          </button>
        </form>
      )}
    </section>
  );
}
