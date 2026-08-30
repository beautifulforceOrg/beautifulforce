import { describe, expect, it } from "vitest";
import { serializeProductSummary } from "./mobile-serialize";

describe("serializeProductSummary", () => {
  it("picks the first image and derives inStock from variants", () => {
    const dto = serializeProductSummary({
      id: "1",
      slug: "blue-frock",
      name: "Blue Frock",
      price: 550000,
      images: [{ url: "https://example.com/a.jpg" }, { url: "https://example.com/b.jpg" }],
      variants: [{ stockQty: 3 }],
    });
    expect(dto).toEqual({
      id: "1",
      slug: "blue-frock",
      name: "Blue Frock",
      price: 550000,
      imageUrl: "https://example.com/a.jpg",
      inStock: true,
    });
  });

  it("omits imageUrl when the product has no images", () => {
    const dto = serializeProductSummary({
      id: "1",
      slug: "blue-frock",
      name: "Blue Frock",
      price: 550000,
      images: [],
      variants: [{ stockQty: 3 }],
    });
    expect(dto.imageUrl).toBeUndefined();
  });

  it("is out of stock when every variant is sold out", () => {
    const dto = serializeProductSummary({
      id: "1",
      slug: "blue-frock",
      name: "Blue Frock",
      price: 550000,
      images: [],
      variants: [{ stockQty: 0 }],
    });
    expect(dto.inStock).toBe(false);
  });
});
