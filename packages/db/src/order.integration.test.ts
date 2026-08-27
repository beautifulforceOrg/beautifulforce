import { beforeEach, describe, expect, it } from "vitest";
import { db } from "./client";

// Scoped to this file's own fixture slugs/emails/ids -- other packages'
// integration tests and apps/_template's seed data ("Sample Item") share
// this same local Postgres, and an unscoped deleteMany() here previously
// wiped their rows out from under them when tests ran concurrently.
const OWNED_SLUGS = ["item-1", "item-2"];
const OWNED_EMAIL = "shopper@example.com";
const OWNED_GATEWAY_ORDER_ID = "db_test_order_1";

beforeEach(async () => {
  await db.orderItem.deleteMany({ where: { product: { slug: { in: OWNED_SLUGS } } } });
  await db.order.deleteMany({ where: { gatewayOrderId: OWNED_GATEWAY_ORDER_ID } });
  await db.product.deleteMany({ where: { slug: { in: OWNED_SLUGS } } });
  await db.customer.deleteMany({ where: { email: OWNED_EMAIL } });
});

describe("core schema (real Postgres, no mocked Prisma client)", () => {
  it("creates an order with correct line items", async () => {
    const product = await db.product.create({
      data: { name: "Item", price: 5500, slug: "item-1" },
    });

    const order = await db.order.create({
      data: { items: { create: [{ productId: product.id, quantity: 2 }] } },
      include: { items: true },
    });

    expect(order.items).toHaveLength(1);
    expect(order.items[0]?.quantity).toBe(2);
    expect(order.status).toBe("PENDING");
  });

  it("links an order to a customer", async () => {
    const customer = await db.customer.create({
      data: { email: "shopper@example.com", name: "Shopper" },
    });

    const order = await db.order.create({
      data: { customerId: customer.id },
      include: { customer: true },
    });

    expect(order.customer?.email).toBe("shopper@example.com");
  });

  it("enforces one order per gateway order id at the database level", async () => {
    await db.order.create({ data: { gatewayOrderId: OWNED_GATEWAY_ORDER_ID } });

    await expect(
      db.order.create({ data: { gatewayOrderId: OWNED_GATEWAY_ORDER_ID } })
    ).rejects.toThrow();
  });

  it("deleting an order cascades to its line items", async () => {
    const product = await db.product.create({
      data: { name: "Item", price: 1200, slug: "item-2" },
    });
    const order = await db.order.create({
      data: { items: { create: [{ productId: product.id, quantity: 1 }] } },
    });

    await db.order.delete({ where: { id: order.id } });

    const remaining = await db.orderItem.findMany({ where: { orderId: order.id } });
    expect(remaining).toHaveLength(0);
  });
});
