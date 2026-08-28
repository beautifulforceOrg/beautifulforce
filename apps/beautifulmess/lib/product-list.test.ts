import { describe, expect, it } from "vitest";
import { filterAndSortProducts, type FilterableProduct } from "./product-list";

const PRODUCTS: FilterableProduct[] = [
  { name: "Blue Frock", price: 5500, createdAt: "2026-01-01", variants: [{ stockQty: 2 }] },
  { name: "Ankle Boots", price: 3000, createdAt: "2026-03-01", variants: [{ stockQty: 0 }] },
  { name: "Cream Frock", price: 4000, createdAt: "2026-02-01", variants: [] },
];

describe("filterAndSortProducts", () => {
  it("sorts by title ascending", () => {
    const result = filterAndSortProducts(PRODUCTS, { sort: "title-ascending" });
    expect(result.map((p) => p.name)).toEqual(["Ankle Boots", "Blue Frock", "Cream Frock"]);
  });

  it("sorts by price descending", () => {
    const result = filterAndSortProducts(PRODUCTS, { sort: "price-descending" });
    expect(result.map((p) => p.name)).toEqual(["Blue Frock", "Cream Frock", "Ankle Boots"]);
  });

  it("sorts by newest first", () => {
    const result = filterAndSortProducts(PRODUCTS, { sort: "created-descending" });
    expect(result.map((p) => p.name)).toEqual(["Ankle Boots", "Cream Frock", "Blue Frock"]);
  });

  it("filters to in-stock only", () => {
    const result = filterAndSortProducts(PRODUCTS, { availability: "in-stock" });
    expect(result.map((p) => p.name).sort()).toEqual(["Blue Frock", "Cream Frock"]);
  });

  it("filters to out-of-stock only", () => {
    const result = filterAndSortProducts(PRODUCTS, { availability: "out-of-stock" });
    expect(result.map((p) => p.name)).toEqual(["Ankle Boots"]);
  });

  it("filters by price range", () => {
    const result = filterAndSortProducts(PRODUCTS, { minPrice: 3500, maxPrice: 5000 });
    expect(result.map((p) => p.name)).toEqual(["Cream Frock"]);
  });

  it("leaves order unchanged for 'featured'", () => {
    const result = filterAndSortProducts(PRODUCTS, { sort: "featured" });
    expect(result.map((p) => p.name)).toEqual(["Blue Frock", "Ankle Boots", "Cream Frock"]);
  });
});
