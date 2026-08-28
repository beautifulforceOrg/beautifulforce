import { describe, expect, it } from "vitest";
import { applyDiscountCode } from "./discount";

describe("applyDiscountCode", () => {
  it("applies MESS05 as 5% off", () => {
    expect(applyDiscountCode("MESS05", 10000)).toEqual({
      valid: true,
      code: "MESS05",
      percentOff: 0.05,
      amountOff: 500,
    });
  });

  it("is case-insensitive and trims whitespace", () => {
    expect(applyDiscountCode("  mess05 ", 10000).valid).toBe(true);
  });

  it("rejects an unknown code", () => {
    expect(applyDiscountCode("NOTREAL", 10000)).toEqual({
      valid: false,
      code: "NOTREAL",
      percentOff: 0,
      amountOff: 0,
    });
  });
});
