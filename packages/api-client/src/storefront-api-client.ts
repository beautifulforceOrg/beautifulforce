import type { CollectionDetail, CollectionFilters, ProductSummary } from "./types";

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
}

async function requestJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new StorefrontApiError(`Request to ${url} failed with status ${response.status}`, response.status);
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

// A base URL, not a shared singleton client -- each storefront app points
// this at its own apps/<client>'s deployment, matching the per-storefront
// isolation model (own DB/domain/Vercel project) described in CLAUDE.md.
export function createStorefrontApiClient(baseUrl: string): StorefrontApiClient {
  const origin = baseUrl.replace(/\/$/, "");

  return {
    getFeaturedProducts() {
      return requestJson<ProductSummary[]>(`${origin}/api/mobile/products`);
    },
    getCollection(slug, filters = {}) {
      return requestJson<CollectionDetail>(`${origin}/api/mobile/collections/${slug}${buildCollectionQuery(filters)}`);
    },
  };
}
