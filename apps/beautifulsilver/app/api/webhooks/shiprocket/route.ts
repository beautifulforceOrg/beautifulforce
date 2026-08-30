import { POST as shiprocketWebhook } from "@storeforge/shipping";

// packages/shipping's default handler already updates by gatewayOrderId
// rather than creating a row, so it composes directly with this
// storefront's pre-created-order model with no wrapper needed. Wrapped
// (not re-exported) only so Next's typed-route validation sees a plain
// single-argument handler.
export async function POST(request: Request): Promise<Response> {
  return shiprocketWebhook(request);
}
