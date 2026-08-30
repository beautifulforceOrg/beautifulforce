import { describe, expect, it } from "vitest";
import { buildRazorpayCheckoutOptions } from "./razorpay-checkout";

describe("buildRazorpayCheckoutOptions", () => {
  it("builds the options Razorpay's Checkout.js widget expects", () => {
    expect(buildRazorpayCheckoutOptions({ keyId: "rzp_test_abc", gatewayOrderId: "order_1", amount: 189900 })).toEqual({
      key: "rzp_test_abc",
      amount: 189900,
      currency: "INR",
      order_id: "order_1",
      name: "Beautiful Silver",
      theme: { color: "#3A4A63" },
    });
  });
});
