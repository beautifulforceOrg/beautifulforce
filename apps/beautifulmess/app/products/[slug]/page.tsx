import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getCompleteTheLook,
  getProductBySlug,
  getWishlistedProductIds,
  getYouMayAlsoLike,
} from "../../../lib/catalog";
import { getSessionCustomerId } from "../../../lib/auth";
import { ProductDetail } from "./product-detail";

// Every product previously served the same site-wide title/description
// (app/layout.tsx's static metadata) -- a real SEO gap for a catalog
// site, since neither Google nor a shared social-media link preview
// could distinguish one product from another.
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  const plainDescription = product.description?.replace(/<[^>]*>/g, "").trim();
  const description = plainDescription
    ? plainDescription.slice(0, 160)
    : `Shop ${product.name} from Beautiful Mess.`;

  return {
    title: `${product.name} | Beautiful Mess`,
    description,
    openGraph: {
      title: product.name,
      description,
      images: product.images[0] ? [{ url: product.images[0].url }] : undefined,
    },
  };
}

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
