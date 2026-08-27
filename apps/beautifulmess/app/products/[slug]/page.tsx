import { notFound } from "next/navigation";
import { getProductBySlug } from "../../../lib/catalog";
import { ProductDetail } from "./product-detail";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    notFound();
  }

  return <ProductDetail product={product} />;
}
