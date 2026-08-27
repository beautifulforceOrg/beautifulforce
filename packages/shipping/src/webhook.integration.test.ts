import { db } from "@storeforge/db";
import { beforeEach, describe, expect, it } from "vitest";
import { POST } from "./webhook";

const WEBHOOK_URL = "http://localhost/api/webhooks/shiprocket";
const TOKEN = process.env.SHIPROCKET_WEBHOOK_TOKEN!;

function mockRequest(payload: unknown, token = TOKEN): Request {
  return new Request(WEBHOOK_URL, {
    method: "POST",
    headers: { "x-api-key": token },
    body: JSON.stringify(payload),
  });
}

beforeEach(async () => {
  await db.order.deleteMany();
});

describe("Shiprocket webhook (real Postgres, no mocked Prisma client)", () => {
  it("marks an order fulfilled when the courier reports delivery", async () => {
    await db.order.create({ data: { gatewayOrderId: "order_1", status: "PAID" } });

    const response = await POST(
      mockRequest({ awb: "AWB1", current_status: "DELIVERED", order_id: "order_1" })
    );

    expect(response.status).toBe(200);
    const order = await db.order.findUnique({ where: { gatewayOrderId: "order_1" } });
    expect(order?.status).toBe("FULFILLED");
  });

  it("leaves the order untouched for a status with no clear mapping", async () => {
    await db.order.create({ data: { gatewayOrderId: "order_2", status: "PAID" } });

    const response = await POST(
      mockRequest({ awb: "AWB2", current_status: "OUT FOR DELIVERY", order_id: "order_2" })
    );

    expect(response.status).toBe(200);
    const order = await db.order.findUnique({ where: { gatewayOrderId: "order_2" } });
    expect(order?.status).toBe("PAID");
  });

  it("rejects a request without the correct webhook token", async () => {
    await db.order.create({ data: { gatewayOrderId: "order_3", status: "PAID" } });

    const response = await POST(
      mockRequest({ awb: "AWB3", current_status: "DELIVERED", order_id: "order_3" }, "wrong-token")
    );

    expect(response.status).toBe(401);
    const order = await db.order.findUnique({ where: { gatewayOrderId: "order_3" } });
    expect(order?.status).toBe("PAID");
  });
});
