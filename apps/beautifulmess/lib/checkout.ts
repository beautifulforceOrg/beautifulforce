import { db } from "@storeforge/db";
import { calculateCartTotal, createRazorpayOrderFromEnv } from "@storeforge/payments";
import type { AddressValue } from "@storeforge/ui";
import { applyDiscountCode } from "./discount";

export interface CheckoutLine {
  productId: string;
  variantId?: string;
  price: number;
  quantity: number;
}

/**
 * The customerId-taking core of order placement, shared by the
 * cookie-authenticated web Server Action (lib/actions.ts's placeOrder,
 * a thin wrapper resolving customerId from the cookie) and the
 * Bearer-authenticated mobile route (app/api/mobile/orders/route.ts) --
 * same "one function, two transport wrappers" pattern as Phase 2/3.
 *
 * customerId is nullable: both the web and mobile paths allow guest
 * checkout, same as before this was extracted.
 *
 * `address` is optional because the mobile app doesn't collect one yet
 * (a known gap, not solved here -- see apps/beautifulmess-mobile). An
 * order placed without one simply never gets a Shiprocket shipment
 * created (see lib/shipping.ts's shipToAddressFrom), left for manual
 * follow-up rather than blocking guest/mobile checkout entirely.
 */
export async function placeOrderFor(
  customerId: string | null,
  lines: CheckoutLine[],
  discountCode?: string,
  address?: AddressValue
): Promise<{ gatewayOrderId: string; amount: number; isMocked: boolean }> {
  const subtotal = calculateCartTotal(lines.map((line) => ({ price: line.price, qty: line.quantity })));
  const discount = discountCode ? await applyDiscountCode(discountCode, subtotal) : null;
  const amount = discount?.valid ? subtotal - discount.amountOff : subtotal;
  const receipt = `receipt_${Date.now()}`;
  const isMocked = process.env.E2E_MOCK_EXTERNAL_APIS === "1";

  const gatewayOrderId = isMocked ? `order_e2e_${Date.now()}` : (await createRazorpayOrderFromEnv({ amount, receipt })).id;

  await db.order.create({
    data: {
      gatewayOrderId,
      status: "PENDING",
      customerId: customerId ?? undefined,
      shipToName: address?.name,
      shipToEmail: address?.email,
      shipToPhone: address?.phone,
      shipToAddressLine1: address?.addressLine1,
      shipToAddressLine2: address?.addressLine2 || null,
      shipToCity: address?.city,
      shipToState: address?.state,
      shipToPincode: address?.pincode,
      amountPaid: amount,
      discountAmount: discount?.valid ? discount.amountOff : null,
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

export async function getOrderStatus(gatewayOrderId: string): Promise<{ gatewayOrderId: string; status: string } | null> {
  const order = await db.order.findUnique({ where: { gatewayOrderId }, select: { gatewayOrderId: true, status: true } });
  if (!order?.gatewayOrderId) return null;
  return { gatewayOrderId: order.gatewayOrderId, status: order.status };
}
