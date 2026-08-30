"use server";

import type { AddressValue } from "@storeforge/ui";
import { getSessionCustomerId } from "./auth";
import { placeOrderFor, type CheckoutLine } from "./checkout";

export type { CheckoutLine };

/**
 * Pre-creates the Order row at PENDING, same composition as
 * apps/_template -- see that app's README for why (and
 * app/api/webhooks/razorpay/route.ts here for the matching webhook side).
 * The discount code is re-validated and re-applied here, never trusting
 * a client-computed total.
 *
 * `isMocked` tells the client whether `gatewayOrderId` is a real Razorpay
 * order (safe to open the real Checkout widget against) or a synthetic
 * id used under E2E_MOCK_EXTERNAL_APIS -- opening the real widget against
 * a fake order id would fail against Razorpay's own servers.
 */
export async function placeOrder(
  lines: CheckoutLine[],
  discountCode?: string,
  address?: AddressValue
): Promise<{ gatewayOrderId: string; amount: number; isMocked: boolean }> {
  const customerId = await getSessionCustomerId();
  return placeOrderFor(customerId, lines, discountCode, address);
}
