import { NextResponse } from "next/server";
import { getCustomerIdFromAuthHeader } from "../../../../lib/auth";
import { placeOrderFor, type CheckoutLine } from "../../../../lib/checkout";

function isCheckoutLine(value: unknown): value is CheckoutLine {
  if (!value || typeof value !== "object") return false;
  const line = value as Record<string, unknown>;
  return typeof line.productId === "string" && typeof line.price === "number" && typeof line.quantity === "number";
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const lines = Array.isArray(body?.lines) ? body.lines.filter(isCheckoutLine) : [];
  if (lines.length === 0) {
    return NextResponse.json({ error: "At least one order line is required" }, { status: 400 });
  }

  const discountCode = typeof body?.discountCode === "string" ? body.discountCode : undefined;
  // Guest checkout is allowed here too, matching the web Server Action --
  // a missing/invalid Bearer token just means the order has no customerId.
  const customerId = getCustomerIdFromAuthHeader(request);

  const result = await placeOrderFor(customerId, lines, discountCode);
  return NextResponse.json(result);
}
