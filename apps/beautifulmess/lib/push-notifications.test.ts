import { db } from "@storeforge/db";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendOrderStatusPushNotification } from "./push-notifications";

const GATEWAY_ORDER_ID = "push_test_order_1";
const EMAIL = "push-test-customer@example.com";

async function cleanup() {
  await db.order.deleteMany({ where: { gatewayOrderId: GATEWAY_ORDER_ID } });
  await db.customer.deleteMany({ where: { email: EMAIL } });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

afterAll(cleanup);

describe("sendOrderStatusPushNotification", () => {
  beforeEach(cleanup);

  it("posts to Expo's push endpoint with the customer's stored token", async () => {
    const customer = await db.customer.create({ data: { email: EMAIL, expoPushToken: "ExponentPushToken[test123]" } });
    await db.order.create({ data: { gatewayOrderId: GATEWAY_ORDER_ID, status: "PAID", customerId: customer.id } });

    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    await sendOrderStatusPushNotification(GATEWAY_ORDER_ID, "FULFILLED");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://exp.host/--/api/v2/push/send",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          to: "ExponentPushToken[test123]",
          title: "Order update",
          body: "Your order is now fulfilled.",
          data: { gatewayOrderId: GATEWAY_ORDER_ID, status: "FULFILLED" },
        }),
      })
    );
  });

  it("does nothing when the customer has no stored push token", async () => {
    const customer = await db.customer.create({ data: { email: EMAIL } });
    await db.order.create({ data: { gatewayOrderId: GATEWAY_ORDER_ID, status: "PAID", customerId: customer.id } });

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await sendOrderStatusPushNotification(GATEWAY_ORDER_ID, "FULFILLED");

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does nothing for an order with no customer (guest checkout)", async () => {
    await db.order.create({ data: { gatewayOrderId: GATEWAY_ORDER_ID, status: "PAID" } });

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await sendOrderStatusPushNotification(GATEWAY_ORDER_ID, "FULFILLED");

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does nothing for an unknown gatewayOrderId", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await sendOrderStatusPushNotification("does-not-exist", "FULFILLED");

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
