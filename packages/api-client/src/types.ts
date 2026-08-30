// Mirrors apps/beautifulmess/lib/mobile-serialize.ts's ProductSummaryDTO --
// duplicated rather than imported, since this package must stay usable
// from a mobile app with no dependency on a particular storefront's server
// code (same rationale as packages/ui-native's duplicated formatPrice).
export interface ProductSummary {
  id: string;
  slug: string;
  name: string;
  price: number;
  imageUrl?: string;
  inStock: boolean;
}

export interface CollectionDetail {
  id: string;
  slug: string;
  name: string;
  products: ProductSummary[];
}

export interface CollectionFilters {
  sort?: string;
  availability?: "in-stock" | "out-of-stock";
  /** Rupees, not paise -- converted to paise server-side, matching the web PLP's own Min/Max inputs. */
  minPrice?: number;
  maxPrice?: number;
}

export interface AuthSession {
  token: string;
  expiresInSeconds: number;
}

