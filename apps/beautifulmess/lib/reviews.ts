export interface RatingSummary {
  average: number;
  count: number;
}

export function summarizeRatings(ratings: number[]): RatingSummary {
  if (ratings.length === 0) {
    return { average: 0, count: 0 };
  }
  const total = ratings.reduce((sum, rating) => sum + rating, 0);
  return { average: Math.round((total / ratings.length) * 10) / 10, count: ratings.length };
}
