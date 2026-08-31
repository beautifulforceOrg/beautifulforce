import { db } from "@storeforge/db";

// "Estimated revenue" is now real, not a caveated list-price guess:
// amountPaid/discountAmount are persisted per-order at checkout time
// (lib/checkout.ts), so this sums what was actually charged.
const REVENUE_STATUSES = ["PAID", "FULFILLED"] as const;

export interface RevenueByDayPoint {
  date: string; // YYYY-MM-DD
  amountPaise: number;
}

export async function revenueByDay(days = 14): Promise<RevenueByDayPoint[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const orders = await db.order.findMany({
    where: { status: { in: [...REVENUE_STATUSES] }, createdAt: { gte: since } },
    select: { createdAt: true, amountPaid: true },
  });

  const buckets = new Map<string, number>();
  for (const order of orders) {
    const key = order.createdAt.toISOString().slice(0, 10);
    buckets.set(key, (buckets.get(key) ?? 0) + (order.amountPaid ?? 0));
  }

  return Array.from(buckets.entries())
    .map(([date, amountPaise]) => ({ date, amountPaise }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export interface TopProduct {
  productId: string;
  name: string;
  unitsSold: number;
  revenuePaise: number;
}

export async function topProducts(limit = 5, days = 30): Promise<TopProduct[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const items = await db.orderItem.findMany({
    where: { order: { status: { in: [...REVENUE_STATUSES] }, createdAt: { gte: since } } },
    include: { product: { select: { id: true, name: true, price: true } }, variant: { select: { price: true } } },
  });

  const byProduct = new Map<string, TopProduct>();
  for (const item of items) {
    const price = item.variant?.price ?? item.product.price;
    const existing = byProduct.get(item.product.id) ?? {
      productId: item.product.id,
      name: item.product.name,
      unitsSold: 0,
      revenuePaise: 0,
    };
    existing.unitsSold += item.quantity;
    existing.revenuePaise += price * item.quantity;
    byProduct.set(item.product.id, existing);
  }

  return Array.from(byProduct.values())
    .sort((a, b) => b.revenuePaise - a.revenuePaise)
    .slice(0, limit);
}
