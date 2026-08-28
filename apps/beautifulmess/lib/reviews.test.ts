import { describe, expect, it } from "vitest";
import { summarizeRatings } from "./reviews";

describe("summarizeRatings", () => {
  it("returns a zeroed summary for no reviews", () => {
    expect(summarizeRatings([])).toEqual({ average: 0, count: 0 });
  });

  it("averages and rounds to one decimal place", () => {
    expect(summarizeRatings([5, 4, 4])).toEqual({ average: 4.3, count: 3 });
  });

  it("handles a single review", () => {
    expect(summarizeRatings([3])).toEqual({ average: 3, count: 1 });
  });
});
