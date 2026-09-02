import { db } from "@storeforge/db";
import type { CartLine } from "./cart-context";

/**
 * Reads a logged-in customer's server-persisted cart, joining live
 * Product/ProductVariant data for name/price/variantLabel rather than
 * storing a snapshot -- a cart should never show a stale price. Returns
 * [] for a customer with no server cart yet (never checked out from a
 * second device, or a brand-new customer).
 */
export async function getServerCart(customerId: string): Promise<CartLine[]> {
  const cart = await db.cart.findUnique({
    where: { customerId },
    include: { items: { include: { product: true, variant: true } } },
  });
  if (!cart) return [];

  return cart.items.map((item) => ({
    productId: item.productId,
    variantId: item.variantId ?? undefined,
    variantLabel: item.variant?.value,
    name: item.product.name,
    price: item.variant?.price ?? item.product.price,
    quantity: item.quantity,
    giftRecipientEmail: item.giftRecipientEmail ?? undefined,
    giftRecipientName: item.giftRecipientName ?? undefined,
    giftMessage: item.giftMessage ?? undefined,
  }));
}

/**
 * Replaces the customer's entire server cart with `lines` -- called
 * best-effort in the background on every local cart change (see
 * lib/cart-context.tsx), never awaited by the UI. Delete-then-recreate
 * rather than diffing: a cart is always a handful of lines, so this is
 * simpler and just as fast as a real diff would be at this scale.
 */
export async function saveServerCart(customerId: string, lines: CartLine[]): Promise<void> {
  await db.$transaction([
    db.cartItem.deleteMany({ where: { cart: { customerId } } }),
    db.cart.upsert({
      where: { customerId },
      create: {
        customerId,
        items: {
          create: lines.map((line) => ({
            productId: line.productId,
            variantId: line.variantId,
            quantity: line.quantity,
            giftRecipientEmail: line.giftRecipientEmail,
            giftRecipientName: line.giftRecipientName,
            giftMessage: line.giftMessage,
          })),
        },
      },
      update: {
        items: {
          create: lines.map((line) => ({
            productId: line.productId,
            variantId: line.variantId,
            quantity: line.quantity,
            giftRecipientEmail: line.giftRecipientEmail,
            giftRecipientName: line.giftRecipientName,
            giftMessage: line.giftMessage,
          })),
        },
      },
    }),
  ]);
}

