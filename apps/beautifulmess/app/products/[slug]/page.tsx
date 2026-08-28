import { notFound } from "next/navigation";
import { getProductBySlug, getWishlistedProductIds } from "../../../lib/catalog";
import { ProductDetail } from "./product-detail";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, wishlistedIds] = await Promise.all([getProductBySlug(slug), getWishlistedProductIds()]);
  if (!product) {
    notFound();
  }

  return <ProductDetail product={product} initialWishlisted={wishlistedIds.includes(product.id)} />;
}
