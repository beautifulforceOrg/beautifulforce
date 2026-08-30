// Builds the options object for Razorpay's own Checkout.js widget
// (https://checkout.razorpay.com/v1/checkout.js, loaded in
// app/checkout/page.tsx) -- kept as a pure function so the shape of what
// we hand the widget is unit-testable without a browser or real
// credentials. Same pattern as apps/beautifulmess/lib/razorpay-checkout.ts.
export interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  theme: { color: string };
}

export function buildRazorpayCheckoutOptions(params: {
  keyId: string;
  gatewayOrderId: string;
  amount: number;
}): RazorpayCheckoutOptions {
  return {
    key: params.keyId,
    amount: params.amount,
    currency: "INR",
    order_id: params.gatewayOrderId,
    name: "Beautiful Silver",
    theme: { color: "#3A4A63" },
  };
}
