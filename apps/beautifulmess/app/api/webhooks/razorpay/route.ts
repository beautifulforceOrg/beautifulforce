import { db } from "@storeforge/db";
import { verifyRazorpaySignature, type RazorpayWebhookPayload } from "@storeforge/payments";

// See apps/_template/app/api/webhooks/razorpay/route.ts -- same
// pre-created-order composition, same reasoning.
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
    await db.order.updateMany({
      where: { gatewayOrderId, status: "PENDING" },
      data: { status: "PAID" },
    });
  }

  return new Response("OK", { status: 200 });
}
