import { NextRequest, NextResponse } from "next/server";
import { getCollectionBySlug } from "../../../../../lib/catalog";
import { filterAndSortProducts } from "../../../../../lib/product-list";
import { serializeProductSummary } from "../../../../../lib/mobile-serialize";

export async function GET(request: NextRequest, { params }: { params: Promise<{ collectionSlug: string }> }) {
  const { collectionSlug } = await params;
  const collection = await getCollectionBySlug(collectionSlug);
  if (!collection) {
    return NextResponse.json({ error: "Collection not found" }, { status: 404 });
  }

  const searchParams = request.nextUrl.searchParams;
  const availability = searchParams.get("availability");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");

  // Same rupees-to-paise conversion the web PLP applies to its Min/Max
  // inputs -- Product.price is stored in paise (see schema.prisma).
  const products = filterAndSortProducts(collection.products, {
    sort: searchParams.get("sort") ?? undefined,
    availability: availability === "in-stock" || availability === "out-of-stock" ? availability : undefined,
    minPrice: minPrice ? Number(minPrice) * 100 : undefined,
    maxPrice: maxPrice ? Number(maxPrice) * 100 : undefined,
  });

  return NextResponse.json({
    id: collection.id,
    slug: collection.slug,
    name: collection.name,
    products: products.map(serializeProductSummary),
  });
}
