import { listReviews } from "../../../../lib/admin/reviews";
import { ReviewsClient } from "./reviews-client";

export default async function AdminReviewsPage() {
  const reviews = await listReviews();
  return <ReviewsClient initialReviews={reviews} />;
}
