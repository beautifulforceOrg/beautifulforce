import { NextRequest, NextResponse } from "next/server";
import { searchProducts } from "../../../../lib/catalog";
import { serializeProductSummary } from "../../../../lib/mobile-serialize";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";
  const products = await searchProducts(query);
  return NextResponse.json(products.map(serializeProductSummary));
}
