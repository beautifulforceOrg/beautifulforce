import { db } from "@storeforge/db";
import { verifyRazorpaySignature, type RazorpayWebhookPayload } from "@storeforge/payments";
import { createShipmentForOrder } from "../../../../lib/shipping";

// See apps/_template/app/api/webhooks/razorpay/route.ts -- same
// pre-created-order composition, same reasoning.
//
// Creating the Shiprocket shipment here (not in a separate step) keeps
// "payment confirmed" and "handed off to fulfillment" a single
// transition -- a redelivered webhook is a no-op because the order is no
// longer PENDING by the time it arrives a second time.
export async function POST(request: Request): Promise<Response> {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("RAZORPAY_WEBHOOK_SECRET must be set");
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!signature || !verifyRazorpaySignature(rawBody, signature, secret)) {
    return new Response("Invalid signature", { status: 400 });
  }

  const payload = JSON.parse(rawBody) as RazorpayWebhookPayload;

  if (payload.event === "payment.captured") {
    const gatewayOrderId = payload.payload.payment.entity.order_id;
    const { count } = await db.order.updateMany({
      where: { gatewayOrderId, status: "PENDING" },
      data: { status: "PAID" },
    });

    if (count > 0) {
      const order = await db.order.findUnique({ where: { gatewayOrderId } });
      if (order) {
        try {
          await createShipmentForOrder(order.id);
        } catch (error) {
          // Payment is captured either way -- a Shiprocket outage or a
          // missing/incomplete address shouldn't fail the webhook (Razorpay
          // would just retry it, and the order is no longer PENDING so
          // that retry would silently skip this block forever). Logged for
          // manual follow-up instead.
          console.error(`Failed to create Shiprocket shipment for order ${order.id}`, error);
        }
      }
    }
  }

  return new Response("OK", { status: 200 });
}
