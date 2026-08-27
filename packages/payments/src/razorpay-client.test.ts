import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { createRazorpayOrder } from "./razorpay-client";

// onUnhandledRequest: "error" makes any request this suite doesn't
// explicitly mock fail the test -- the structural guarantee that this
// suite never depends on network access or a real Razorpay account.
const server = setupServer(
  http.post("https://api.razorpay.com/v1/orders", async ({ request }) => {
    const body = (await request.json()) as { amount: number; currency: string; receipt: string };
    return HttpResponse.json({
      id: "order_mock123",
      amount: body.amount,
      currency: body.currency,
      receipt: body.receipt,
      status: "created",
    });
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("createRazorpayOrder", () => {
  it("creates an order without making a real network call", async () => {
    const order = await createRazorpayOrder(
      { amount: 5500, currency: "INR", receipt: "receipt_1" },
      { keyId: "rzp_test_key", keySecret: "rzp_test_secret" }
    );

    expect(order.id).toBe("order_mock123");
    expect(order.amount).toBe(5500);
    expect(order.receipt).toBe("receipt_1");
  });

  it("throws a descriptive error when Razorpay rejects the request", async () => {
    server.use(
      http.post("https://api.razorpay.com/v1/orders", () =>
        HttpResponse.json({ error: { description: "Invalid key" } }, { status: 401 })
      )
    );

    await expect(
      createRazorpayOrder({ amount: 100, currency: "INR", receipt: "r2" }, { keyId: "bad", keySecret: "bad" })
    ).rejects.toThrow(/401/);
  });
});
