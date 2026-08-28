import { notFound } from "next/navigation";
import {
  getCompleteTheLook,
  getProductBySlug,
  getWishlistedProductIds,
  getYouMayAlsoLike,
} from "../../../lib/catalog";
import { getSessionCustomerId } from "../../../lib/auth";
import { ProductDetail } from "./product-detail";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, wishlistedIds, customerId] = await Promise.all([
    getProductBySlug(slug),
    getWishlistedProductIds(),
    getSessionCustomerId(),
  ]);
  if (!product) {
    notFound();
  }

  const collectionIds = product.collections.map((c) => c.id);
  const [completeTheLook, youMayAlsoLike] = await Promise.all([
    getCompleteTheLook(product.id, collectionIds),
    getYouMayAlsoLike(product.id, collectionIds),
  ]);

  return (
    <ProductDetail
      product={product}
      initialWishlisted={wishlistedIds.includes(product.id)}
      completeTheLook={completeTheLook}
      youMayAlsoLike={youMayAlsoLike}
      hasReviewedAlready={product.reviews.some((review) => review.customerId === customerId)}
    />
  );
}
