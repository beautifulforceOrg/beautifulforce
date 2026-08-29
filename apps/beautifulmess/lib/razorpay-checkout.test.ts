import { describe, expect, it } from "vitest";
import { buildRazorpayCheckoutOptions } from "./razorpay-checkout";

describe("buildRazorpayCheckoutOptions", () => {
  it("builds options tying the widget to the real gateway order and amount", () => {
    const options = buildRazorpayCheckoutOptions({
      keyId: "rzp_test_abc123",
      gatewayOrderId: "order_xyz",
      amount: 550000,
    });

    expect(options.key).toBe("rzp_test_abc123");
    expect(options.order_id).toBe("order_xyz");
    expect(options.amount).toBe(550000);
    expect(options.currency).toBe("INR");
    expect(options.name).toBe("Beautiful Mess");
  });
});
