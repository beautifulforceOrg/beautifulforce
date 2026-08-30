"use client";

import Script from "next/script";
import { useState } from "react";
import { buildRazorpayCheckoutOptions } from "../../../../lib/razorpay-checkout";

declare global {
  interface Window {
    Razorpay?: new (options: unknown) => { open: () => void };
  }
}

// A minimal, mobile-browser-friendly page opened from apps/mobile-template
// via expo-web-browser (WebBrowser.openBrowserAsync) -- there's no native
// Razorpay SDK usable from Expo Go, so the mobile app hands off to
// Razorpay's own hosted Checkout.js here, the same widget the web app's
// own app/checkout/page.tsx opens in-page. The real webhook
// (app/api/webhooks/razorpay/route.ts) is the authoritative source for
// marking the order PAID either way -- this page's job is only to launch
// the widget and tell the shopper to return to the app afterwards.
export function MobilePayClient({ gatewayOrderId, amount, keyId }: { gatewayOrderId: string; amount: number; keyId: string }) {
  const [status, setStatus] = useState<"opening" | "done" | "cancelled" | "error">("opening");

  function openCheckout() {
    if (!window.Razorpay) {
      setStatus("error");
      return;
    }
    const razorpay = new window.Razorpay({
      ...buildRazorpayCheckoutOptions({ keyId, gatewayOrderId, amount }),
      handler: () => setStatus("done"),
      modal: {
        ondismiss: () => setStatus("cancelled"),
      },
    });
    razorpay.open();
  }

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "4rem 1.5rem", textAlign: "center" }}>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" onLoad={openCheckout} />
      {status === "opening" ? <p>Opening secure payment...</p> : null}
      {status === "done" ? <p>Payment submitted. You can return to the app now.</p> : null}
      {status === "cancelled" ? <p>Payment cancelled. You can return to the app and try again.</p> : null}
      {status === "error" ? <p>Payment could not be loaded. Please check your connection and try again.</p> : null}
    </main>
  );
}
