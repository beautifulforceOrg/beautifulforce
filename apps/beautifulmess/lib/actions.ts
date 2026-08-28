"use server";

import { db } from "@storeforge/db";
import { calculateCartTotal, createRazorpayOrderFromEnv } from "@storeforge/payments";
import { getSessionCustomerId } from "./auth";
import { applyDiscountCode } from "./discount";

export interface CheckoutLine {
  productId: string;
  variantId?: string;
  price: number;
  quantity: number;
}

/**
 * Pre-creates the Order row at PENDING, same composition as
 * apps/_template -- see that app's README for why (and
 * app/api/webhooks/razorpay/route.ts here for the matching webhook side).
 * The discount code is re-validated and re-applied here, never trusting
 * a client-computed total.
 */
export async function placeOrder(
  lines: CheckoutLine[],
  discountCode?: string
): Promise<{ gatewayOrderId: string }> {
  const subtotal = calculateCartTotal(lines.map((line) => ({ price: line.price, qty: line.quantity })));
  const discount = discountCode ? applyDiscountCode(discountCode, subtotal) : null;
  const amount = discount?.valid ? subtotal - discount.amountOff : subtotal;
  const receipt = `receipt_${Date.now()}`;

  const gatewayOrderId =
    process.env.E2E_MOCK_EXTERNAL_APIS === "1"
      ? `order_e2e_${Date.now()}`
      : (await createRazorpayOrderFromEnv({ amount, receipt })).id;

  const customerId = await getSessionCustomerId();

  await db.order.create({
    data: {
      gatewayOrderId,
      status: "PENDING",
      customerId: customerId ?? undefined,
      items: {
        create: lines.map((line) => ({
          productId: line.productId,
          variantId: line.variantId,
          quantity: line.quantity,
        })),
      },
    },
  });

  return { gatewayOrderId };
}
