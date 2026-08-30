import { NextResponse } from "next/server";
import { getCustomerIdFromAuthHeader } from "../../../../../../lib/auth";
import { getProductBySlug } from "../../../../../../lib/catalog";
import { submitReviewFor } from "../../../../../../lib/review-submission";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const customerId = getCustomerIdFromAuthHeader(request);
  if (!customerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const rating = Number(body?.rating);
  const comment = typeof body?.comment === "string" ? body.comment : "";

  const result = await submitReviewFor(customerId, product.id, { rating, comment });
  if (result.error) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}
