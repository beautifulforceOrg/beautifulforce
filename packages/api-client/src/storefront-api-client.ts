import { createInMemoryTokenStorage, type TokenStorage } from "./token-storage";
import type {
  AuthSession,
  CheckoutLine,
  Collection,
  CollectionDetail,
  CollectionFilters,
  ContactMessageInput,
  OrderStatus,
  PlaceOrderResult,
  ProductDetail,
  ProductSummary,
  PushTokenRegistrationResult,
} from "./types";

export class StorefrontApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "StorefrontApiError";
  }
}

export interface StorefrontApiClient {
  getFeaturedProducts(): Promise<ProductSummary[]>;
  getCollection(slug: string, filters?: CollectionFilters): Promise<CollectionDetail>;
  logIn(email: string, password: string): Promise<void>;
  signUp(email: string, password: string, name?: string): Promise<void>;
  logOut(): Promise<void>;
  isLoggedIn(): Promise<boolean>;
  getWishlist(): Promise<string[]>;
  toggleWishlist(productId: string): Promise<{ wishlisted: boolean }>;
  placeOrder(lines: CheckoutLine[], discountCode?: string): Promise<PlaceOrderResult>;
  getOrderStatus(gatewayOrderId: string): Promise<OrderStatus>;
  registerPushToken(token: string): Promise<PushTokenRegistrationResult>;
  getCollections(): Promise<Collection[]>;
  getProduct(slug: string): Promise<ProductDetail>;
  /** Throws StorefrontApiError (with the server's validation message) on failure. */
  submitReview(slug: string, rating: number, comment: string): Promise<void>;
  search(query: string): Promise<ProductSummary[]>;
  /** Throws StorefrontApiError (with the server's validation message) on failure. */
  submitContactMessage(input: ContactMessageInput): Promise<void>;
}

async function parseJsonBody(response: Response): Promise<unknown> {
  return response.json().catch(() => null);
}

async function requestJson<T>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    const body = (await parseJsonBody(response)) as { error?: string } | null;
    throw new StorefrontApiError(body?.error ?? `Request to ${url} failed with status ${response.status}`, response.status);
  }
  return (await response.json()) as T;
}

function buildCollectionQuery(filters: CollectionFilters): string {
  const params = new URLSearchParams();
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.availability) params.set("availability", filters.availability);
  if (filters.minPrice !== undefined) params.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice !== undefined) params.set("maxPrice", String(filters.maxPrice));
  const query = params.toString();
  return query ? `?${query}` : "";
}

const JSON_HEADERS = { "content-type": "application/json" };

// A base URL, not a shared singleton client -- each storefront app points
// this at its own apps/<client>'s deployment, matching the per-storefront
// isolation model (own DB/domain/Vercel project) described in CLAUDE.md.
export function createStorefrontApiClient(baseUrl: string, tokenStorage: TokenStorage = createInMemoryTokenStorage()): StorefrontApiClient {
  const origin = baseUrl.replace(/\/$/, "");

  async function authHeaders(): Promise<Record<string, string>> {
    const token = await tokenStorage.getToken();
    return token ? { authorization: `Bearer ${token}` } : {};
  }

  async function storeSession(session: AuthSession): Promise<void> {
    await tokenStorage.setToken(session.token);
  }

  return {
    getFeaturedProducts() {
      return requestJson<ProductSummary[]>(`${origin}/api/mobile/products`);
    },
    getCollection(slug, filters = {}) {
      return requestJson<CollectionDetail>(`${origin}/api/mobile/collections/${slug}${buildCollectionQuery(filters)}`);
    },
    async logIn(email, password) {
      const session = await requestJson<AuthSession>(`${origin}/api/mobile/auth/login`, {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ email, password }),
      });
      await storeSession(session);
    },
    async signUp(email, password, name) {
      const session = await requestJson<AuthSession>(`${origin}/api/mobile/auth/signup`, {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ email, password, name }),
      });
      await storeSession(session);
    },
    async logOut() {
      await tokenStorage.clearToken();
    },
    async isLoggedIn() {
      return (await tokenStorage.getToken()) !== null;
    },
    async getWishlist() {
      const { productIds } = await requestJson<{ productIds: string[] }>(`${origin}/api/mobile/wishlist`, {
        headers: await authHeaders(),
      });
      return productIds;
    },
    async toggleWishlist(productId) {
      return requestJson<{ wishlisted: boolean }>(`${origin}/api/mobile/wishlist`, {
        method: "POST",
        headers: { ...JSON_HEADERS, ...(await authHeaders()) },
        body: JSON.stringify({ productId }),
      });
    },
    async placeOrder(lines, discountCode) {
      return requestJson<PlaceOrderResult>(`${origin}/api/mobile/orders`, {
        method: "POST",
        headers: { ...JSON_HEADERS, ...(await authHeaders()) },
        body: JSON.stringify({ lines, discountCode }),
      });
    },
    getOrderStatus(gatewayOrderId) {
      return requestJson<OrderStatus>(`${origin}/api/mobile/orders/${gatewayOrderId}`);
    },
    async registerPushToken(token) {
      return requestJson<PushTokenRegistrationResult>(`${origin}/api/mobile/push-token`, {
        method: "POST",
        headers: { ...JSON_HEADERS, ...(await authHeaders()) },
        body: JSON.stringify({ token }),
      });
    },
    getCollections() {
      return requestJson<Collection[]>(`${origin}/api/mobile/collections`);
    },
    async getProduct(slug) {
      return requestJson<ProductDetail>(`${origin}/api/mobile/products/${slug}`, {
        headers: await authHeaders(),
      });
    },
    async submitReview(slug, rating, comment) {
      await requestJson(`${origin}/api/mobile/products/${slug}/reviews`, {
        method: "POST",
        headers: { ...JSON_HEADERS, ...(await authHeaders()) },
        body: JSON.stringify({ rating, comment }),
      });
    },
    search(query) {
      return requestJson<ProductSummary[]>(`${origin}/api/mobile/search?q=${encodeURIComponent(query)}`);
    },
    async submitContactMessage(input) {
      await requestJson(`${origin}/api/mobile/contact`, {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify(input),
      });
    },
  };
}
