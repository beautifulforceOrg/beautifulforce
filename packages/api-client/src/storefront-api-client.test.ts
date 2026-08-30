import { afterEach, describe, expect, it, vi } from "vitest";
import { createStorefrontApiClient, StorefrontApiError } from "./storefront-api-client";
import { createInMemoryTokenStorage } from "./token-storage";

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

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:3000/api/mobile/products", {});
    expect(result).toEqual(products);
  });

  it("strips a trailing slash from the base URL", async () => {
    const fetchMock = mockFetchOnce([]);
    const client = createStorefrontApiClient("http://localhost:3000/");
    await client.getFeaturedProducts();
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:3000/api/mobile/products", {});
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
      "http://localhost:3000/api/mobile/collections/frocks?sort=price-ascending&availability=in-stock&minPrice=500&maxPrice=2000",
      {}
    );
    expect(result).toEqual(collection);
  });

  it("getCollection omits the query string entirely when no filters are given", async () => {
    const fetchMock = mockFetchOnce({ id: "1", slug: "frocks", name: "Frocks", products: [] });
    const client = createStorefrontApiClient("http://localhost:3000");
    await client.getCollection("frocks");
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:3000/api/mobile/collections/frocks", {});
  });

  it("throws a StorefrontApiError with the response status on a non-2xx response", async () => {
    mockFetchOnce({ error: "Collection not found" }, 404);
    const client = createStorefrontApiClient("http://localhost:3000");

    const error = await client.getCollection("does-not-exist").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(StorefrontApiError);
    expect((error as InstanceType<typeof StorefrontApiError>).status).toBe(404);
    expect((error as Error).message).toBe("Collection not found");
  });

  describe("auth", () => {
    it("logIn posts credentials and persists the returned token", async () => {
      const fetchMock = mockFetchOnce({ token: "signed.token.value", expiresInSeconds: 2592000 });
      const tokenStorage = createInMemoryTokenStorage();
      const client = createStorefrontApiClient("http://localhost:3000", tokenStorage);

      await client.logIn("shopper@example.com", "correct horse battery");

      expect(fetchMock).toHaveBeenCalledWith("http://localhost:3000/api/mobile/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "shopper@example.com", password: "correct horse battery" }),
      });
      expect(await tokenStorage.getToken()).toBe("signed.token.value");
      expect(await client.isLoggedIn()).toBe(true);
    });

    it("signUp posts the new account and persists the returned token", async () => {
      mockFetchOnce({ token: "signed.token.value", expiresInSeconds: 2592000 });
      const tokenStorage = createInMemoryTokenStorage();
      const client = createStorefrontApiClient("http://localhost:3000", tokenStorage);

      await client.signUp("shopper@example.com", "correct horse battery", "Shopper");

      expect(await tokenStorage.getToken()).toBe("signed.token.value");
    });

    it("logOut clears the persisted token", async () => {
      const tokenStorage = createInMemoryTokenStorage();
      await tokenStorage.setToken("signed.token.value");
      const client = createStorefrontApiClient("http://localhost:3000", tokenStorage);

      await client.logOut();

      expect(await tokenStorage.getToken()).toBeNull();
      expect(await client.isLoggedIn()).toBe(false);
    });

    it("isLoggedIn is false with no stored token", async () => {
      const client = createStorefrontApiClient("http://localhost:3000", createInMemoryTokenStorage());
      expect(await client.isLoggedIn()).toBe(false);
    });
  });

  describe("wishlist", () => {
    it("getWishlist attaches the stored token as a Bearer header", async () => {
      const fetchMock = mockFetchOnce({ productIds: ["p1", "p2"] });
      const tokenStorage = createInMemoryTokenStorage();
      await tokenStorage.setToken("signed.token.value");
      const client = createStorefrontApiClient("http://localhost:3000", tokenStorage);

      const result = await client.getWishlist();

      expect(fetchMock).toHaveBeenCalledWith("http://localhost:3000/api/mobile/wishlist", {
        headers: { authorization: "Bearer signed.token.value" },
      });
      expect(result).toEqual(["p1", "p2"]);
    });

    it("getWishlist sends no Authorization header when logged out", async () => {
      const fetchMock = mockFetchOnce({ productIds: [] });
      const client = createStorefrontApiClient("http://localhost:3000", createInMemoryTokenStorage());

      await client.getWishlist();

      expect(fetchMock).toHaveBeenCalledWith("http://localhost:3000/api/mobile/wishlist", { headers: {} });
    });

    it("toggleWishlist posts the productId with the Bearer header", async () => {
      const fetchMock = mockFetchOnce({ wishlisted: true });
      const tokenStorage = createInMemoryTokenStorage();
      await tokenStorage.setToken("signed.token.value");
      const client = createStorefrontApiClient("http://localhost:3000", tokenStorage);

      const result = await client.toggleWishlist("product_1");

      expect(fetchMock).toHaveBeenCalledWith("http://localhost:3000/api/mobile/wishlist", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer signed.token.value" },
        body: JSON.stringify({ productId: "product_1" }),
      });
      expect(result).toEqual({ wishlisted: true });
    });
  });

  describe("checkout", () => {
    it("placeOrder posts the lines and discount code with the Bearer header", async () => {
      const fetchMock = mockFetchOnce({ gatewayOrderId: "order_1", amount: 100000, isMocked: true });
      const tokenStorage = createInMemoryTokenStorage();
      await tokenStorage.setToken("signed.token.value");
      const client = createStorefrontApiClient("http://localhost:3000", tokenStorage);

      const lines = [{ productId: "p1", price: 100000, quantity: 1 }];
      const result = await client.placeOrder(lines, "MESS05");

      expect(fetchMock).toHaveBeenCalledWith("http://localhost:3000/api/mobile/orders", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer signed.token.value" },
        body: JSON.stringify({ lines, discountCode: "MESS05" }),
      });
      expect(result).toEqual({ gatewayOrderId: "order_1", amount: 100000, isMocked: true });
    });

    it("placeOrder works with no Authorization header for guest checkout", async () => {
      const fetchMock = mockFetchOnce({ gatewayOrderId: "order_1", amount: 100000, isMocked: true });
      const client = createStorefrontApiClient("http://localhost:3000", createInMemoryTokenStorage());

      await client.placeOrder([{ productId: "p1", price: 100000, quantity: 1 }]);

      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:3000/api/mobile/orders",
        expect.objectContaining({ headers: { "content-type": "application/json" } })
      );
    });

    it("getOrderStatus fetches the order's status", async () => {
      const fetchMock = mockFetchOnce({ gatewayOrderId: "order_1", status: "PAID" });
      const client = createStorefrontApiClient("http://localhost:3000");

      const result = await client.getOrderStatus("order_1");

      expect(fetchMock).toHaveBeenCalledWith("http://localhost:3000/api/mobile/orders/order_1", {});
      expect(result).toEqual({ gatewayOrderId: "order_1", status: "PAID" });
    });
  });

  describe("push notifications", () => {
    it("registerPushToken posts the token with the Bearer header", async () => {
      const fetchMock = mockFetchOnce({ ok: true });
      const tokenStorage = createInMemoryTokenStorage();
      await tokenStorage.setToken("signed.token.value");
      const client = createStorefrontApiClient("http://localhost:3000", tokenStorage);

      const result = await client.registerPushToken("ExponentPushToken[abc123]");

      expect(fetchMock).toHaveBeenCalledWith("http://localhost:3000/api/mobile/push-token", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer signed.token.value" },
        body: JSON.stringify({ token: "ExponentPushToken[abc123]" }),
      });
      expect(result).toEqual({ ok: true });
    });
  });

  describe("catalog content parity", () => {
    it("getCollections fetches the collection list", async () => {
      const fetchMock = mockFetchOnce([{ id: "1", slug: "frocks", name: "Frocks" }]);
      const client = createStorefrontApiClient("http://localhost:3000");

      const result = await client.getCollections();

      expect(fetchMock).toHaveBeenCalledWith("http://localhost:3000/api/mobile/collections", {});
      expect(result).toEqual([{ id: "1", slug: "frocks", name: "Frocks" }]);
    });

    it("getProduct fetches product detail with the Bearer header", async () => {
      const detail = { id: "1", slug: "blue-frock", name: "Blue Frock" };
      const fetchMock = mockFetchOnce(detail);
      const tokenStorage = createInMemoryTokenStorage();
      await tokenStorage.setToken("signed.token.value");
      const client = createStorefrontApiClient("http://localhost:3000", tokenStorage);

      const result = await client.getProduct("blue-frock");

      expect(fetchMock).toHaveBeenCalledWith("http://localhost:3000/api/mobile/products/blue-frock", {
        headers: { authorization: "Bearer signed.token.value" },
      });
      expect(result).toEqual(detail);
    });

    it("submitReview posts rating and comment with the Bearer header", async () => {
      const fetchMock = mockFetchOnce({});
      const tokenStorage = createInMemoryTokenStorage();
      await tokenStorage.setToken("signed.token.value");
      const client = createStorefrontApiClient("http://localhost:3000", tokenStorage);

      await client.submitReview("blue-frock", 5, "Lovely!");

      expect(fetchMock).toHaveBeenCalledWith("http://localhost:3000/api/mobile/products/blue-frock/reviews", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer signed.token.value" },
        body: JSON.stringify({ rating: 5, comment: "Lovely!" }),
      });
    });

    it("submitReview throws a StorefrontApiError with the server's message on failure", async () => {
      mockFetchOnce({ error: "Please choose a rating from 1 to 5." }, 400);
      const client = createStorefrontApiClient("http://localhost:3000");

      const error = await client.submitReview("blue-frock", 9, "Lovely!").catch((e: unknown) => e);
      expect(error).toBeInstanceOf(StorefrontApiError);
      expect((error as Error).message).toBe("Please choose a rating from 1 to 5.");
    });

    it("search encodes the query string", async () => {
      const fetchMock = mockFetchOnce([]);
      const client = createStorefrontApiClient("http://localhost:3000");

      await client.search("blue frock");

      expect(fetchMock).toHaveBeenCalledWith("http://localhost:3000/api/mobile/search?q=blue%20frock", {});
    });

    it("submitContactMessage posts the contact form", async () => {
      const fetchMock = mockFetchOnce({});
      const client = createStorefrontApiClient("http://localhost:3000");

      await client.submitContactMessage({ name: "Jane", email: "jane@example.com", comment: "Hello" });

      expect(fetchMock).toHaveBeenCalledWith("http://localhost:3000/api/mobile/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Jane", email: "jane@example.com", comment: "Hello" }),
      });
    });
  });
});
