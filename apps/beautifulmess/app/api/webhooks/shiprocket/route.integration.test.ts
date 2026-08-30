import { db } from "@storeforge/db";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const GATEWAY_ORDER_ID = "push_pipeline_test_order";
const EMAIL = "push-pipeline-test@example.com";
const TOKEN = process.env.SHIPROCKET_WEBHOOK_TOKEN!;

function webhookRequest(payload: unknown): Request {
  return new Request("http://localhost/api/webhooks/shiprocket", {
    method: "POST",
    headers: { "x-api-key": TOKEN },
    body: JSON.stringify(payload),
  });
}

async function cleanup() {
  await db.order.deleteMany({ where: { gatewayOrderId: GATEWAY_ORDER_ID } });
  await db.customer.deleteMany({ where: { email: EMAIL } });
}

beforeEach(cleanup);
afterEach(() => vi.unstubAllGlobals());
afterAll(cleanup);

describe("POST /api/webhooks/shiprocket (push notification pipeline)", () => {
  it("sends a push notification to the order's customer when the courier reports delivery", async () => {
    const customer = await db.customer.create({ data: { email: EMAIL, expoPushToken: "ExponentPushToken[pipeline123]" } });
    await db.order.create({ data: { gatewayOrderId: GATEWAY_ORDER_ID, status: "PAID", customerId: customer.id } });

    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(webhookRequest({ awb: "AWB1", current_status: "DELIVERED", order_id: GATEWAY_ORDER_ID }));

    expect(response.status).toBe(200);
    const order = await db.order.findUnique({ where: { gatewayOrderId: GATEWAY_ORDER_ID } });
    expect(order?.status).toBe("FULFILLED");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://exp.host/--/api/v2/push/send",
      expect.objectContaining({
        body: JSON.stringify({
          to: "ExponentPushToken[pipeline123]",
          title: "Order update",
          body: "Your order is now fulfilled.",
          data: { gatewayOrderId: GATEWAY_ORDER_ID, status: "FULFILLED" },
        }),
      })
    );
  });

  it("does not send a push when the customer never registered a token", async () => {
    const customer = await db.customer.create({ data: { email: EMAIL } });
    await db.order.create({ data: { gatewayOrderId: GATEWAY_ORDER_ID, status: "PAID", customerId: customer.id } });

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await POST(webhookRequest({ awb: "AWB1", current_status: "DELIVERED", order_id: GATEWAY_ORDER_ID }));

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
