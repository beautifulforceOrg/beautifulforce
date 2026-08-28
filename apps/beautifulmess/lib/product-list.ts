import { isProductInStock } from "./inventory";

export type SortOption =
  | "featured"
  | "title-ascending"
  | "title-descending"
  | "price-ascending"
  | "price-descending"
  | "created-descending";

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "created-descending", label: "Date, new to old" },
  { value: "title-ascending", label: "Alphabetically, A-Z" },
  { value: "title-descending", label: "Alphabetically, Z-A" },
  { value: "price-ascending", label: "Price, low to high" },
  { value: "price-descending", label: "Price, high to low" },
];

export interface ProductListFilters {
  sort?: string;
  availability?: "in-stock" | "out-of-stock";
  minPrice?: number;
  maxPrice?: number;
}

export interface FilterableProduct {
  name: string;
  price: number;
  createdAt: string | Date;
  variants: { stockQty: number | null }[];
}

export function filterAndSortProducts<T extends FilterableProduct>(
  products: T[],
  filters: ProductListFilters
): T[] {
  let result = products;

  if (filters.availability) {
    const wantInStock = filters.availability === "in-stock";
    result = result.filter((product) => isProductInStock(product.variants) === wantInStock);
  }
  if (filters.minPrice !== undefined) {
    const min = filters.minPrice;
    result = result.filter((product) => product.price >= min);
  }
  if (filters.maxPrice !== undefined) {
    const max = filters.maxPrice;
    result = result.filter((product) => product.price <= max);
  }

  const sorted = [...result];
  switch (filters.sort) {
    case "title-ascending":
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "title-descending":
      sorted.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case "price-ascending":
      sorted.sort((a, b) => a.price - b.price);
      break;
    case "price-descending":
      sorted.sort((a, b) => b.price - a.price);
      break;
    case "created-descending":
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
    default:
      break;
  }
  return sorted;
}
