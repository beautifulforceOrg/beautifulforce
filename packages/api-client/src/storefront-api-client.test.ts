import { afterEach, describe, expect, it, vi } from "vitest";
import { createStorefrontApiClient, StorefrontApiError } from "./storefront-api-client";

function mockFetchOnce(body: unknown, status = 200) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createStorefrontApiClient", () => {
  it("getFeaturedProducts fetches /api/mobile/products from the given base URL", async () => {
    const products = [{ id: "1", slug: "a", name: "A", price: 100, inStock: true }];
    const fetchMock = mockFetchOnce(products);

    const client = createStorefrontApiClient("http://localhost:3000");
    const result = await client.getFeaturedProducts();

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:3000/api/mobile/products");
    expect(result).toEqual(products);
  });

  it("strips a trailing slash from the base URL", async () => {
    const fetchMock = mockFetchOnce([]);
    const client = createStorefrontApiClient("http://localhost:3000/");
    await client.getFeaturedProducts();
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:3000/api/mobile/products");
  });

  it("getCollection encodes sort/availability/price filters as query params", async () => {
    const collection = { id: "1", slug: "frocks", name: "Frocks", products: [] };
    const fetchMock = mockFetchOnce(collection);

    const client = createStorefrontApiClient("http://localhost:3000");
    const result = await client.getCollection("frocks", {
      sort: "price-ascending",
      availability: "in-stock",
      minPrice: 500,
      maxPrice: 2000,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/mobile/collections/frocks?sort=price-ascending&availability=in-stock&minPrice=500&maxPrice=2000"
    );
    expect(result).toEqual(collection);
  });

  it("getCollection omits the query string entirely when no filters are given", async () => {
    const fetchMock = mockFetchOnce({ id: "1", slug: "frocks", name: "Frocks", products: [] });
    const client = createStorefrontApiClient("http://localhost:3000");
    await client.getCollection("frocks");
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:3000/api/mobile/collections/frocks");
  });

  it("throws a StorefrontApiError with the response status on a non-2xx response", async () => {
    mockFetchOnce({ error: "Collection not found" }, 404);
    const client = createStorefrontApiClient("http://localhost:3000");

    const error = await client.getCollection("does-not-exist").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(StorefrontApiError);
    expect((error as InstanceType<typeof StorefrontApiError>).status).toBe(404);
  });
});
