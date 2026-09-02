import { db } from "@storeforge/db";

/**
 * Auto-cancels PENDING orders older than `olderThanHours` -- an order
 * that was created at checkout but never actually paid (the customer
 * abandoned the Razorpay flow, or it failed silently). These otherwise
 * sit as PENDING forever, cluttering the admin orders list. Only ever
 * touches PENDING orders; PAID/FULFILLED/CANCELLED are untouched
 * regardless of age. See app/api/cron/cancel-stale-orders/route.ts for
 * the scheduled entry point (Vercel Cron, see vercel.json).
 */
export async function cancelStaleOrders(olderThanHours = 48): Promise<number> {
  const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
  const result = await db.order.updateMany({
    where: { status: "PENDING", createdAt: { lt: cutoff } },
    data: { status: "CANCELLED" },
  });
  return result.count;
}
