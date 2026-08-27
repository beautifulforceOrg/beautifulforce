import { NextResponse } from "next/server";
import { getFeaturedProducts } from "../../../lib/catalog";

export async function GET() {
  const products = await getFeaturedProducts(4);
  return NextResponse.json(
    products.map((product) => ({
      id: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      images: product.images,
    }))
  );
}
