import { isProductInStock } from "./inventory";

export interface ProductSummaryDTO {
  id: string;
  slug: string;
  name: string;
  price: number;
  imageUrl?: string;
  inStock: boolean;
}

export interface SerializableProduct {
  id: string;
  slug: string;
  name: string;
  price: number;
  images: { url: string }[];
  variants: { stockQty: number | null }[];
}

export function serializeProductSummary(product: SerializableProduct): ProductSummaryDTO {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    imageUrl: product.images[0]?.url,
    inStock: isProductInStock(product.variants),
  };
}
