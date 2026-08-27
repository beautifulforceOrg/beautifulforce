import { db } from "@storeforge/db";

export interface ShiprocketWebhookPayload {
  awb: string;
  current_status: string;
  order_id: string;
}

// Only statuses that map unambiguously onto the core OrderStatus enum are
// applied. Anything else (IN TRANSIT, OUT FOR DELIVERY, ...) is acknowledged
// but left alone -- packages/db's schema doesn't model shipment-in-flight
// states, and this package shouldn't grow the core schema to fit one
// courier's vocabulary.
const STATUS_MAP: Record<string, "FULFILLED" | "CANCELLED"> = {
  DELIVERED: "FULFILLED",
  CANCELED: "CANCELLED",
  CANCELLED: "CANCELLED",
};

export async function applyCourierStatus(payload: ShiprocketWebhookPayload): Promise<void> {
  const mappedStatus = STATUS_MAP[payload.current_status.toUpperCase()];
  if (!mappedStatus) {
    return;
  }

  await db.order.updateMany({
    where: { gatewayOrderId: payload.order_id },
    data: { status: mappedStatus },
  });
}

/**
 * A Next.js Route Handler-compatible webhook endpoint. Configure the same
 * token as the "Webhook Secret" in the Shiprocket panel and pass it back as
 * SHIPROCKET_WEBHOOK_TOKEN -- see packages/shipping/README.md.
 */
export async function POST(request: Request): Promise<Response> {
  const expectedToken = process.env.SHIPROCKET_WEBHOOK_TOKEN;
  if (!expectedToken) {
    throw new Error("SHIPROCKET_WEBHOOK_TOKEN must be set");
  }

  const providedToken = request.headers.get("x-api-key");
  if (providedToken !== expectedToken) {
    return new Response("Invalid token", { status: 401 });
  }

  const payload = (await request.json()) as ShiprocketWebhookPayload;
  await applyCourierStatus(payload);

  return new Response("OK", { status: 200 });
}
