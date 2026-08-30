import { describe, expect, it } from "vitest";
import { getFeaturedProducts } from "../../../../lib/catalog";
import { serializeProductSummary } from "../../../../lib/mobile-serialize";
import { GET } from "./route";

describe("GET /api/mobile/products", () => {
  it("returns the same featured products, serialized, as the web homepage's own getFeaturedProducts", async () => {
    const response = await GET();
    const body = await response.json();

    const expected = (await getFeaturedProducts(24)).map(serializeProductSummary);
    expect(body).toEqual(expected);
  });
});
