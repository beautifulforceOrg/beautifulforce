import { db } from "@storeforge/db";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { cancelStaleOrders } from "./cancel-stale-orders";

const EMAIL = "cancel-stale-orders-test@example.com";

let customerId: string;

async function cleanup() {
  await db.order.deleteMany({ where: { customer: { email: EMAIL } } });
  await db.customer.deleteMany({ where: { email: EMAIL } });
}

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

beforeEach(async () => {
  await cleanup();
  // Local Postgres isn't reset between test runs, and this job operates
  // globally (not scoped to one customer) -- clear out any *genuinely
  // stale* (>48h old) PENDING orders left behind by other interrupted
  // test runs, so each test's own counts start from zero instead of an
  // unpredictable leftover. Using the real 48h threshold (not 0) means
  // this can never race with a concurrently-running test file's own
  // freshly-created PENDING order -- nothing created moments ago can
  // already be 48 hours old.
  await cancelStaleOrders(48);
  const customer = await db.customer.create({ data: { email: EMAIL } });
  customerId = customer.id;
});

afterAll(cleanup);

describe("cancelStaleOrders", () => {
  it("cancels a PENDING order older than the cutoff", async () => {
    const order = await db.order.create({ data: { customerId, status: "PENDING" } });
    await db.order.update({ where: { id: order.id }, data: { createdAt: hoursAgo(72) } });

    const count = await cancelStaleOrders(48);
    expect(count).toBe(1);

    const updated = await db.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(updated.status).toBe("CANCELLED");
  });

  it("leaves a recent PENDING order untouched", async () => {
    const order = await db.order.create({ data: { customerId, status: "PENDING" } });
    await db.order.update({ where: { id: order.id }, data: { createdAt: hoursAgo(1) } });

    const count = await cancelStaleOrders(48);
    expect(count).toBe(0);

    const updated = await db.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(updated.status).toBe("PENDING");
  });

  it("never touches a PAID, FULFILLED, or already-CANCELLED order, however old", async () => {
    const paid = await db.order.create({ data: { customerId, status: "PAID" } });
    const fulfilled = await db.order.create({ data: { customerId, status: "FULFILLED" } });
    const cancelled = await db.order.create({ data: { customerId, status: "CANCELLED" } });
    await db.order.updateMany({
      where: { id: { in: [paid.id, fulfilled.id, cancelled.id] } },
      data: { createdAt: hoursAgo(200) },
    });

    const count = await cancelStaleOrders(48);
    expect(count).toBe(0);

    for (const id of [paid.id, fulfilled.id, cancelled.id]) {
      const order = await db.order.findUniqueOrThrow({ where: { id } });
      expect(order.status).not.toBe("CANCELLED_BY_MISTAKE");
    }
    expect((await db.order.findUniqueOrThrow({ where: { id: paid.id } })).status).toBe("PAID");
    expect((await db.order.findUniqueOrThrow({ where: { id: fulfilled.id } })).status).toBe("FULFILLED");
  });

  it("returns the number of orders it cancelled", async () => {
    const a = await db.order.create({ data: { customerId, status: "PENDING" } });
    const b = await db.order.create({ data: { customerId, status: "PENDING" } });
    await db.order.updateMany({ where: { id: { in: [a.id, b.id] } }, data: { createdAt: hoursAgo(72) } });

    expect(await cancelStaleOrders(48)).toBe(2);
  });
});
