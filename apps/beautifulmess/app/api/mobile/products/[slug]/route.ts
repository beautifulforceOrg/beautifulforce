import { NextRequest, NextResponse } from "next/server";
import { getCompleteTheLook, getProductBySlug, getYouMayAlsoLike } from "../../../../../lib/catalog";
import { getCustomerIdFromAuthHeader } from "../../../../../lib/auth";
import { getWishlistedProductIdsFor } from "../../../../../lib/wishlist";
import { serializeProductDetail } from "../../../../../lib/mobile-serialize";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const customerId = getCustomerIdFromAuthHeader(request);
  const collectionIds = product.collections.map((collection) => collection.id);

  const [wishlistedIds, completeTheLook, youMayAlsoLike] = await Promise.all([
    customerId ? getWishlistedProductIdsFor(customerId) : Promise.resolve([]),
    getCompleteTheLook(product.id, collectionIds),
    getYouMayAlsoLike(product.id, collectionIds),
  ]);

  return NextResponse.json(
    serializeProductDetail(product, {
      customerId,
      wishlisted: wishlistedIds.includes(product.id),
      completeTheLook,
      youMayAlsoLike,
    })
  );
}
