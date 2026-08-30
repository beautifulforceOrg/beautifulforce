import { formatPrice } from "./format-price";

describe("formatPrice", () => {
  it("formats paise as whole-rupee INR currency", () => {
    expect(formatPrice(550000)).toBe("₹5,500");
  });

  it("never rounds -- paise below a whole rupee just truncate for display", () => {
    expect(formatPrice(100)).toBe("₹1");
  });

  it("supports a different currency code", () => {
    expect(formatPrice(100000, "USD")).toBe("$1,000");
  });
});
