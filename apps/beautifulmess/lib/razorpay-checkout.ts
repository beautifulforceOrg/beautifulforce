// Builds the options object for Razorpay's own Checkout.js widget
// (https://checkout.razorpay.com/v1/checkout.js, loaded in
// app/checkout/page.tsx) -- kept as a pure function so the shape of what
// we hand the widget is unit-testable without a browser or real
// credentials. `amount`/`currency` are optional to pass since Razorpay
// derives both from `order_id` server-side, but including them lets the
// widget render before that lookup completes.
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
    name: "Beautiful Mess",
    theme: { color: "#C0504D" },
  };
}
