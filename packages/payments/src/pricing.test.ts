import { describe, expect, it } from "vitest";
import { calculateCartTotal } from "./pricing";

describe("calculateCartTotal", () => {
  it("sums item prices correctly", () => {
    const items = [
      { price: 5500, qty: 1 },
      { price: 1200, qty: 2 },
    ];
    expect(calculateCartTotal(items)).toBe(7900);
  });

  it("returns 0 for an empty cart", () => {
    expect(calculateCartTotal([])).toBe(0);
  });
});
