import { NextResponse } from "next/server";
import { getFeaturedProducts } from "../../../../lib/catalog";
import { serializeProductSummary } from "../../../../lib/mobile-serialize";

export async function GET() {
  const products = await getFeaturedProducts(24);
  return NextResponse.json(products.map(serializeProductSummary));
}
