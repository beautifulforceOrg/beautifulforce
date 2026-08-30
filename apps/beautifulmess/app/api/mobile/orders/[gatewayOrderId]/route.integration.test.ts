import { db } from "@storeforge/db";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { GET } from "./route";

const GATEWAY_ORDER_ID = "order_e2e_mobile_status_test";

async function cleanup() {
  await db.order.deleteMany({ where: { gatewayOrderId: GATEWAY_ORDER_ID } });
}

beforeEach(async () => {
  await cleanup();
  await db.order.create({ data: { gatewayOrderId: GATEWAY_ORDER_ID, status: "PENDING" } });
});

afterAll(cleanup);

describe("GET /api/mobile/orders/[gatewayOrderId]", () => {
  it("returns the order's current status", async () => {
    const response = await GET(new Request("http://localhost/api/mobile/orders/" + GATEWAY_ORDER_ID), {
      params: Promise.resolve({ gatewayOrderId: GATEWAY_ORDER_ID }),
    });
    expect(await response.json()).toEqual({ gatewayOrderId: GATEWAY_ORDER_ID, status: "PENDING" });
  });

  it("reflects a status update made elsewhere (e.g. by the payment webhook)", async () => {
    await db.order.update({ where: { gatewayOrderId: GATEWAY_ORDER_ID }, data: { status: "PAID" } });
    const response = await GET(new Request("http://localhost/api/mobile/orders/" + GATEWAY_ORDER_ID), {
      params: Promise.resolve({ gatewayOrderId: GATEWAY_ORDER_ID }),
    });
    expect((await response.json()).status).toBe("PAID");
  });

  it("404s for an unknown order", async () => {
    const response = await GET(new Request("http://localhost/api/mobile/orders/does-not-exist"), {
      params: Promise.resolve({ gatewayOrderId: "does-not-exist" }),
    });
    expect(response.status).toBe(404);
  });
});
