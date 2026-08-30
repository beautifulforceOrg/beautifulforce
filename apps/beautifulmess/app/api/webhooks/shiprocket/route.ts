import { POST as shiprocketWebhook } from "@storeforge/shipping";
import { sendOrderStatusPushNotification } from "../../../../lib/push-notifications";

export async function POST(request: Request): Promise<Response> {
  return shiprocketWebhook(request, (payload, status) => sendOrderStatusPushNotification(payload.order_id, status));
}
