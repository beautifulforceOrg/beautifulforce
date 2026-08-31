import { notFound } from "next/navigation";
import { getProduct, listCollections } from "../../../../../lib/admin/products";
import { ProductEditClient } from "./product-edit-client";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, collections] = await Promise.all([getProduct(id), listCollections()]);
  if (!product) notFound();

  return <ProductEditClient product={product} allCollections={collections} />;
}
