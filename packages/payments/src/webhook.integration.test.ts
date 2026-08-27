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

// Scoped to this file's own fixture ids -- packages/shipping's integration
// tests hit the same shared local Postgres concurrently, and an unscoped
// deleteMany() here was previously wiping its in-flight rows (and vice
// versa), causing intermittent cross-package test failures.
const OWNED_ORDER_IDS = ["pay_test_order_1", "pay_test_order_2", "pay_test_order_3"];

beforeEach(async () => {
  await db.order.deleteMany({ where: { gatewayOrderId: { in: OWNED_ORDER_IDS } } });
});

describe("Razorpay webhook idempotency (real Postgres, no mocked Prisma client)", () => {
  it("does not create a duplicate order on a repeated webhook", async () => {
    const payload = {
      event: "payment.captured",
      payload: { payment: { entity: { id: "pay_test1", order_id: "pay_test_order_1" } } },
    };

    const first = await POST(mockRequest(payload)); // first delivery
    const second = await POST(mockRequest(payload)); // gateway redelivers the same event

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);

    const orders = await db.order.findMany({ where: { gatewayOrderId: "pay_test_order_1" } });
    expect(orders).toHaveLength(1);
  });

  it("rejects a request with an invalid signature and creates nothing", async () => {
    const payload = {
      event: "payment.captured",
      payload: { payment: { entity: { id: "pay_test2", order_id: "pay_test_order_2" } } },
    };

    const response = await POST(mockRequest(payload, "not-a-real-signature"));

    expect(response.status).toBe(400);
    const orders = await db.order.findMany({ where: { gatewayOrderId: "pay_test_order_2" } });
    expect(orders).toHaveLength(0);
  });

  it("ignores events other than payment.captured", async () => {
    const payload = {
      event: "payment.failed",
      payload: { payment: { entity: { id: "pay_test3", order_id: "pay_test_order_3" } } },
    };

    const response = await POST(mockRequest(payload));

    expect(response.status).toBe(200);
    const orders = await db.order.findMany({ where: { gatewayOrderId: "pay_test_order_3" } });
    expect(orders).toHaveLength(0);
  });
});
