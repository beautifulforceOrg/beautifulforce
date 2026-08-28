import { describe, expect, it } from "vitest";
import { isProductInStock, isVariantInStock } from "./inventory";

describe("isVariantInStock", () => {
  it("treats null as untracked/unlimited", () => {
    expect(isVariantInStock(null)).toBe(true);
  });

  it("treats undefined as untracked/unlimited", () => {
    expect(isVariantInStock(undefined)).toBe(true);
  });

  it("is false at zero stock", () => {
    expect(isVariantInStock(0)).toBe(false);
  });

  it("is true for positive stock", () => {
    expect(isVariantInStock(3)).toBe(true);
  });
});

describe("isProductInStock", () => {
  it("is true for a product with no variants", () => {
    expect(isProductInStock([])).toBe(true);
  });

  it("is true if any variant has stock", () => {
    expect(isProductInStock([{ stockQty: 0 }, { stockQty: 2 }])).toBe(true);
  });

  it("is false only if every variant is sold out", () => {
    expect(isProductInStock([{ stockQty: 0 }, { stockQty: 0 }])).toBe(false);
  });
});
