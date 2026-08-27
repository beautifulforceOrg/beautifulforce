"use server";

import { db } from "@storeforge/db";
import { calculateCartTotal, createRazorpayOrderFromEnv } from "@storeforge/payments";

export interface CheckoutLine {
  productId: string;
  price: number;
  quantity: number;
}

/**
 * Creates a real Razorpay order and a local Order row at PENDING up front
 * -- this storefront's order lifecycle differs slightly from
 * packages/payments' default (which creates the row lazily when the
 * webhook fires). Its own webhook route (app/api/webhooks/razorpay)
 * composes packages/payments' verification primitive with an update
 * instead of the package's default create-based handler to match.
 */
export async function placeOrder(lines: CheckoutLine[]): Promise<{ gatewayOrderId: string }> {
  const amount = calculateCartTotal(lines.map((line) => ({ price: line.price, qty: line.quantity })));
  const receipt = `receipt_${Date.now()}`;

  // The e2e suite mocks only this one outbound call, at the app boundary
  // rather than patching the network -- createRazorpayOrderFromEnv itself
  // is already covered by packages/payments' own MSW-mocked unit tests.
  const gatewayOrderId =
    process.env.E2E_MOCK_EXTERNAL_APIS === "1"
      ? `order_e2e_${Date.now()}`
      : (await createRazorpayOrderFromEnv({ amount, receipt })).id;

  await db.order.create({
    data: {
      gatewayOrderId,
      status: "PENDING",
      items: {
        create: lines.map((line) => ({ productId: line.productId, quantity: line.quantity })),
      },
    },
  });

  return { gatewayOrderId };
}
