import { db } from "@storeforge/db";

// Expo's push service (https://exp.host/--/api/v2/push/send) is a plain
// HTTP endpoint -- no SDK, no account, and no production APNs/FCM
// enrollment needed to deliver to an Expo Go / development-build push
// token (an "ExponentPushToken[...]" string). This is deliberately the
// only push-sending code in the repo; production push (a real client's
// standalone app, with its own APNs key/FCM project) is an explicit
// follow-up in the mobile plan, not built here.
const EXPO_PUSH_ENDPOINT = "https://exp.host/--/api/v2/push/send";

export async function sendOrderStatusPushNotification(gatewayOrderId: string, status: string): Promise<void> {
  const order = await db.order.findUnique({
    where: { gatewayOrderId },
    select: { customer: { select: { expoPushToken: true } } },
  });
  const token = order?.customer?.expoPushToken;
  if (!token) return;

  await fetch(EXPO_PUSH_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      to: token,
      title: "Order update",
      body: `Your order is now ${status.toLowerCase()}.`,
      data: { gatewayOrderId, status },
    }),
  });
}
