import { createHmac } from "node:crypto";
import { db } from "@storeforge/db";
import { beforeEach, describe, expect, it } from "vitest";
import { POST } from "./webhook";

const WEBHOOK_URL = "http://localhost/api/webhooks/razorpay";
const SECRET = process.env.RAZORPAY_WEBHOOK_SECRET!;

function mockRequest(payload: unknown, signature = sign(payload)): Request {
  return new Request(WEBHOOK_URL, {
    method: "POST",
    headers: { "x-razorpay-signature": signature },
    body: JSON.stringify(payload),
  });
}

function sign(payload: unknown): string {
  return createHmac("sha256", SECRET).update(JSON.stringify(payload)).digest("hex");
}

beforeEach(async () => {
  await db.order.deleteMany();
});

describe("Razorpay webhook idempotency (real Postgres, no mocked Prisma client)", () => {
  it("does not create a duplicate order on a repeated webhook", async () => {
    const payload = {
      event: "payment.captured",
      payload: { payment: { entity: { id: "pay_test1", order_id: "order_1" } } },
    };

    const first = await POST(mockRequest(payload)); // first delivery
    const second = await POST(mockRequest(payload)); // gateway redelivers the same event

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);

    const orders = await db.order.findMany({ where: { gatewayOrderId: "order_1" } });
    expect(orders).toHaveLength(1);
  });

  it("rejects a request with an invalid signature and creates nothing", async () => {
    const payload = {
      event: "payment.captured",
      payload: { payment: { entity: { id: "pay_test2", order_id: "order_2" } } },
    };

    const response = await POST(mockRequest(payload, "not-a-real-signature"));

    expect(response.status).toBe(400);
    const orders = await db.order.findMany({ where: { gatewayOrderId: "order_2" } });
    expect(orders).toHaveLength(0);
  });

  it("ignores events other than payment.captured", async () => {
    const payload = {
      event: "payment.failed",
      payload: { payment: { entity: { id: "pay_test3", order_id: "order_3" } } },
    };

    const response = await POST(mockRequest(payload));

    expect(response.status).toBe(200);
    const orders = await db.order.findMany({ where: { gatewayOrderId: "order_3" } });
    expect(orders).toHaveLength(0);
  });
});
