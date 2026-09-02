import { describe, expect, it } from "vitest";
import { mergeCartLines } from "./cart-merge";
import type { CartLine } from "./cart-context";

function line(overrides: Partial<CartLine>): CartLine {
  return { productId: "p1", name: "Test Product", price: 1000, quantity: 1, ...overrides };
}

describe("mergeCartLines", () => {
  it("keeps all lines when there's no overlap", () => {
    const result = mergeCartLines([line({ productId: "p1" })], [line({ productId: "p2" })]);
    expect(result).toHaveLength(2);
  });

  it("sums quantities for the same product instead of duplicating the line", () => {
    const result = mergeCartLines([line({ productId: "p1", quantity: 2 })], [line({ productId: "p1", quantity: 3 })]);
    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(5);
  });

  it("returns a's lines unchanged when b is empty", () => {
    const a = [line({ productId: "p1" })];
    expect(mergeCartLines(a, [])).toEqual(a);
  });

  it("returns b's lines when a is empty", () => {
    const b = [line({ productId: "p1" })];
    expect(mergeCartLines([], b)).toEqual(b);
  });
});
