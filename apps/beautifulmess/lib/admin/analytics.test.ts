import { db } from "@storeforge/db";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { revenueByDay, topProducts } from "./analytics";

const SLUG_A = "admin-analytics-test-a";
const SLUG_B = "admin-analytics-test-b";
const GATEWAY_PREFIX = "order_admin_analytics_test_";

let productA: string;
let productB: string;

async function cleanup() {
  await db.order.deleteMany({ where: { gatewayOrderId: { startsWith: GATEWAY_PREFIX } } });
  await db.product.deleteMany({ where: { slug: { in: [SLUG_A, SLUG_B] } } });
}

beforeEach(async () => {
  await cleanup();
  const a = await db.product.create({ data: { slug: SLUG_A, name: "Analytics Product A", price: 1000 } });
  const b = await db.product.create({ data: { slug: SLUG_B, name: "Analytics Product B", price: 2000 } });
  productA = a.id;
  productB = b.id;

  // Two PAID orders today: A x2 (2000) and B x1 (2000) -- A should have
  // more units, B should have equal revenue.
  await db.order.create({
    data: {
      gatewayOrderId: `${GATEWAY_PREFIX}1`,
      status: "PAID",
      amountPaid: 2000,
      items: { create: [{ productId: productA, quantity: 2 }] },
    },
  });
  await db.order.create({
    data: {
      gatewayOrderId: `${GATEWAY_PREFIX}2`,
      status: "FULFILLED",
      amountPaid: 2000,
      items: { create: [{ productId: productB, quantity: 1 }] },
    },
  });
  // A PENDING order must not count toward revenue.
  await db.order.create({
    data: {
      gatewayOrderId: `${GATEWAY_PREFIX}3`,
      status: "PENDING",
      amountPaid: 5000,
      items: { create: [{ productId: productA, quantity: 5 }] },
    },
  });
});

afterAll(cleanup);

describe("revenueByDay", () => {
  // revenueByDay is a global aggregation by design (that's the real
  // feature) -- other tests/e2e runs may also create real PAID/FULFILLED
  // orders "today" in this same database, so this asserts the increase
  // this test's own fixtures caused, not an absolute total.
  it("sums amountPaid across PAID/FULFILLED orders for today, excluding PENDING", async () => {
    const today = new Date().toISOString().slice(0, 10);

    await db.order.updateMany({ where: { gatewayOrderId: { startsWith: GATEWAY_PREFIX } }, data: { status: "CANCELLED" } });
    const baseline = (await revenueByDay(1)).find((p) => p.date === today)?.amountPaise ?? 0;

    await db.order.update({ where: { gatewayOrderId: `${GATEWAY_PREFIX}1` }, data: { status: "PAID" } });
    await db.order.update({ where: { gatewayOrderId: `${GATEWAY_PREFIX}2` }, data: { status: "FULFILLED" } });

    const withFixtures = (await revenueByDay(1)).find((p) => p.date === today)?.amountPaise ?? 0;
    expect(withFixtures - baseline).toBe(4000);
  });
});

describe("topProducts", () => {
  it("ranks by revenue and reports correct unit counts, excluding PENDING orders", async () => {
    const products = await topProducts(5, 1);
    const a = products.find((p) => p.productId === productA);
    const b = products.find((p) => p.productId === productB);

    expect(a?.unitsSold).toBe(2);
    expect(a?.revenuePaise).toBe(2000);
    expect(b?.unitsSold).toBe(1);
    expect(b?.revenuePaise).toBe(2000);
  });
});
