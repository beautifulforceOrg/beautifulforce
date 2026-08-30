"use server";

import { db } from "@storeforge/db";
import { calculateCartTotal, createRazorpayOrderFromEnv } from "@storeforge/payments";
import type { AddressValue } from "@storeforge/ui";

export interface CheckoutLine {
  productId: string;
  variantId?: string;
  price: number;
  quantity: number;
}

// Pre-creates the Order row at PENDING up front, matching apps/_template's
// composition (see app/api/webhooks/razorpay/route.ts for why) rather than
// packages/payments' default lazy-create-on-webhook pattern.
//
// `isMocked` tells the client whether `gatewayOrderId` is a real Razorpay
// order (safe to open the real Checkout widget against) or a synthetic id
// used under E2E_MOCK_EXTERNAL_APIS -- opening the real widget against a
// fake order id would fail against Razorpay's own servers.
export async function placeOrder(
  lines: CheckoutLine[],
  address: AddressValue
): Promise<{ gatewayOrderId: string; amount: number; isMocked: boolean }> {
  const amount = calculateCartTotal(lines.map((line) => ({ price: line.price, qty: line.quantity })));
  const receipt = `receipt_${Date.now()}`;
  const isMocked = process.env.E2E_MOCK_EXTERNAL_APIS === "1";

  const gatewayOrderId = isMocked ? `order_e2e_${Date.now()}` : (await createRazorpayOrderFromEnv({ amount, receipt })).id;

  await db.order.create({
    data: {
      gatewayOrderId,
      status: "PENDING",
      shipToName: address.name,
      shipToEmail: address.email,
      shipToPhone: address.phone,
      shipToAddressLine1: address.addressLine1,
      shipToAddressLine2: address.addressLine2 || null,
      shipToCity: address.city,
      shipToState: address.state,
      shipToPincode: address.pincode,
      items: {
        create: lines.map((line) => ({
          productId: line.productId,
          variantId: line.variantId,
          quantity: line.quantity,
        })),
      },
    },
  });

  return { gatewayOrderId, amount, isMocked };
}
