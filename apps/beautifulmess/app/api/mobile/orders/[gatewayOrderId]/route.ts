import { NextResponse } from "next/server";
import { getOrderStatus } from "../../../../../lib/checkout";

export async function GET(request: Request, { params }: { params: Promise<{ gatewayOrderId: string }> }) {
  const { gatewayOrderId } = await params;
  const order = await getOrderStatus(gatewayOrderId);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  return NextResponse.json(order);
}
