import { createHmac, timingSafeEqual } from "node:crypto";
import { Prisma, db } from "@storeforge/db";

export function verifyRazorpaySignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const signatureBuffer = Buffer.from(signature, "utf8");

  if (expectedBuffer.length !== signatureBuffer.length) {
    return false;
  }
  return timingSafeEqual(expectedBuffer, signatureBuffer);
}

export interface RazorpayWebhookPayload {
  event: string;
  payload: {
    payment: {
      entity: {
        id: string;
        order_id: string;
      };
    };
  };
}

/**
 * Creates the order row for a captured payment. Order.gatewayOrderId is
 * unique at the database level (packages/db/prisma/schema.prisma) -- that
 * constraint, not application logic, is what makes this safe to call twice
 * with the same event. A duplicate delivery hits P2002 and is treated as
 * already-processed rather than a failure.
 */
export async function handlePaymentCaptured(
  payload: RazorpayWebhookPayload
): Promise<{ created: boolean }> {
  const gatewayOrderId = payload.payload.payment.entity.order_id;

  try {
    await db.order.create({ data: { gatewayOrderId, status: "PAID" } });
    return { created: true };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { created: false };
    }
    throw error;
  }
}

/**
 * A Next.js Route Handler-compatible webhook endpoint. A storefront wires
 * this in directly -- see packages/payments/README.md.
 */
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

  if (payload.event !== "payment.captured") {
    return new Response("Ignored", { status: 200 });
  }

  await handlePaymentCaptured(payload);
  return new Response("OK", { status: 200 });
}
