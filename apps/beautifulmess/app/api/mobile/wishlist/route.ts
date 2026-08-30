import { NextResponse } from "next/server";
import { getCustomerIdFromAuthHeader } from "../../../../lib/auth";
import { getWishlistedProductIdsFor, toggleWishlistFor } from "../../../../lib/wishlist";

export async function GET(request: Request) {
  const customerId = getCustomerIdFromAuthHeader(request);
  if (!customerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const productIds = await getWishlistedProductIdsFor(customerId);
  return NextResponse.json({ productIds });
}

export async function POST(request: Request) {
  const customerId = getCustomerIdFromAuthHeader(request);
  if (!customerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const productId = typeof body?.productId === "string" ? body.productId : null;
  if (!productId) {
    return NextResponse.json({ error: "productId is required" }, { status: 400 });
  }

  const result = await toggleWishlistFor(customerId, productId);
  return NextResponse.json(result);
}
