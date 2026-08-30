import { isProductInStock, isVariantInStock } from "./inventory";
import { summarizeRatings } from "./reviews";

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

export interface VariantDTO {
  id: string;
  name: string;
  value: string;
  price: number | null;
  inStock: boolean;
}

export interface ReviewDTO {
  id: string;
  rating: number;
  comment: string;
  customerName: string | null;
  createdAt: string;
}

export interface ProductDetailDTO {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number;
  images: string[];
  variants: VariantDTO[];
  inStock: boolean;
  ratingSummary: { average: number; count: number };
  reviews: ReviewDTO[];
  hasReviewedAlready: boolean;
  wishlisted: boolean;
  completeTheLook: ProductSummaryDTO | null;
  youMayAlsoLike: ProductSummaryDTO[];
}

export interface SerializableProductDetail {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number;
  images: { url: string }[];
  variants: { id: string; name: string; value: string; price: number | null; stockQty: number | null }[];
  reviews: { id: string; rating: number; comment: string; customerId: string; createdAt: Date; customer: { name: string | null } }[];
}

export function serializeProductDetail(
  product: SerializableProductDetail,
  extras: {
    customerId: string | null;
    wishlisted: boolean;
    completeTheLook: SerializableProduct | null;
    youMayAlsoLike: SerializableProduct[];
  }
): ProductDetailDTO {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    price: product.price,
    images: product.images.map((image) => image.url),
    variants: product.variants.map((variant) => ({
      id: variant.id,
      name: variant.name,
      value: variant.value,
      price: variant.price,
      inStock: isVariantInStock(variant.stockQty),
    })),
    inStock: isProductInStock(product.variants),
    ratingSummary: summarizeRatings(product.reviews.map((review) => review.rating)),
    reviews: product.reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      customerName: review.customer.name,
      createdAt: review.createdAt.toISOString(),
    })),
    hasReviewedAlready: extras.customerId ? product.reviews.some((review) => review.customerId === extras.customerId) : false,
    wishlisted: extras.wishlisted,
    completeTheLook: extras.completeTheLook ? serializeProductSummary(extras.completeTheLook) : null,
    youMayAlsoLike: extras.youMayAlsoLike.map(serializeProductSummary),
  };
}
