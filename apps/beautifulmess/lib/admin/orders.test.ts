import { db } from "@storeforge/db";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { getOrderDetail, listOrders, setOrderStatus } from "./orders";

const SLUG = "admin-orders-test-product";
const GATEWAY_ID_1 = "order_admin_test_1";
const GATEWAY_ID_2 = "order_admin_test_2";
const UNIQUE_NAME = `Priya AdminOrdersTest ${Date.now()}`;

let productId: string;

async function cleanup() {
  await db.order.deleteMany({ where: { gatewayOrderId: { in: [GATEWAY_ID_1, GATEWAY_ID_2] } } });
  await db.product.deleteMany({ where: { slug: SLUG } });
}

beforeEach(async () => {
  await cleanup();
  const product = await db.product.create({ data: { slug: SLUG, name: "Orders Test Product", price: 1000 } });
  productId = product.id;

  await db.order.create({
    data: {
      gatewayOrderId: GATEWAY_ID_1,
      status: "PAID",
      shipToName: UNIQUE_NAME,
      shipToEmail: "priya-admin-orders-test@example.com",
      items: { create: [{ productId, quantity: 1 }] },
    },
  });
  await db.order.create({
    data: {
      gatewayOrderId: GATEWAY_ID_2,
      status: "PENDING",
      shipToName: "Asha Rao",
      shipToEmail: "asha@example.com",
      items: { create: [{ productId, quantity: 2 }] },
    },
  });
});

afterAll(cleanup);

describe("listOrders", () => {
  it("returns all orders with no filters", async () => {
    const orders = await listOrders();
    const gatewayIds = orders.map((o) => o.gatewayOrderId);
    expect(gatewayIds).toContain(GATEWAY_ID_1);
    expect(gatewayIds).toContain(GATEWAY_ID_2);
  });

  it("filters by status", async () => {
    const orders = await listOrders({ status: "PAID" });
    expect(orders.map((o) => o.gatewayOrderId)).toContain(GATEWAY_ID_1);
    expect(orders.map((o) => o.gatewayOrderId)).not.toContain(GATEWAY_ID_2);
  });

  it("filters by a customer name substring", async () => {
    const orders = await listOrders({ search: UNIQUE_NAME });
    expect(orders.map((o) => o.gatewayOrderId)).toEqual([GATEWAY_ID_1]);
  });
});

describe("getOrderDetail / setOrderStatus", () => {
  it("returns full item/product detail for an order", async () => {
    const order = await db.order.findUniqueOrThrow({ where: { gatewayOrderId: GATEWAY_ID_1 } });
    const detail = await getOrderDetail(order.id);

    expect(detail?.items).toHaveLength(1);
    expect(detail?.items[0]?.product.name).toBe("Orders Test Product");
  });

  it("updates an order's status", async () => {
    const order = await db.order.findUniqueOrThrow({ where: { gatewayOrderId: GATEWAY_ID_2 } });
    await setOrderStatus(order.id, "FULFILLED");

    expect((await db.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("FULFILLED");
  });
});
