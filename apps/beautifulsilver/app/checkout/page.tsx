"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AddressForm, CartSummary, type AddressValue } from "@storeforge/ui";
import { placeOrder } from "../../lib/actions";
import { useCart } from "../../lib/cart-context";
import { buildRazorpayCheckoutOptions } from "../../lib/razorpay-checkout";

// Razorpay's Checkout.js attaches this global -- there's no official
// types package for it, so this is the minimal shape we actually use.
declare global {
  interface Window {
    Razorpay?: new (options: unknown) => { open: () => void };
  }
}

const EMPTY_ADDRESS: AddressValue = {
  name: "",
  email: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
};

function isAddressComplete(address: AddressValue): boolean {
  return Boolean(
    address.name && address.email && address.phone && address.addressLine1 && address.city && address.state && address.pincode
  );
}

export default function CheckoutPage() {
  const { lines, clear } = useCart();
  const router = useRouter();
  const [address, setAddress] = useState<AddressValue>(EMPTY_ADDRESS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handlePlaceOrder() {
    setError(null);
    setIsSubmitting(true);
    startTransition(() => {
      placeOrder(
        lines.map((line) => ({
          productId: line.productId,
          variantId: line.variantId,
          price: line.price,
          quantity: line.quantity,
        })),
        address
      )
        .then(({ gatewayOrderId, amount, isMocked }) => {
          // Under E2E_MOCK_EXTERNAL_APIS, gatewayOrderId is synthetic --
          // opening the real widget against it would fail against
          // Razorpay's own servers, so skip straight to the order page the
          // same way the mocked webhook flow already expects.
          if (isMocked) {
            clear();
            router.push(`/orders/${gatewayOrderId}`);
            return;
          }

          if (!window.Razorpay) {
            throw new Error("Payment could not be loaded. Please check your connection and try again.");
          }

          const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
          if (!keyId) {
            throw new Error("Payment is not configured for this store yet.");
          }

          const razorpay = new window.Razorpay({
            ...buildRazorpayCheckoutOptions({ keyId, gatewayOrderId, amount }),
            handler: () => {
              // The webhook (app/api/webhooks/razorpay/route.ts) is the
              // authoritative source for marking the order PAID -- this
              // redirect is just UX, matching the order page's own PENDING
              // state until that webhook arrives.
              clear();
              router.push(`/orders/${gatewayOrderId}`);
            },
            modal: {
              ondismiss: () => {
                setError("Payment was cancelled. Your order is saved -- you can try paying again from your cart.");
              },
            },
          });
          razorpay.open();
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
        })
        .finally(() => setIsSubmitting(false));
    });
  }

  return (
    <main className="mx-auto max-w-2xl p-8">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <h1 className="mb-6 font-heading text-2xl font-semibold text-foreground">Checkout</h1>
      <CartSummary lines={lines} />

      <div className="mt-8">
        <AddressForm
          value={address}
          onChange={setAddress}
          googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
        />
      </div>

      {error ? (
        <p className="mt-4 text-sm" style={{ color: "#B91C1C" }}>
          {error}
        </p>
      ) : null}
      <button
        type="button"
        onClick={handlePlaceOrder}
        disabled={isSubmitting || lines.length === 0 || !isAddressComplete(address)}
        className="mt-6 rounded-[var(--sf-radius,0.5rem)] bg-brand px-4 py-2 text-brand-foreground disabled:opacity-50"
      >
        {isSubmitting ? "Placing order..." : "Pay now"}
      </button>
    </main>
  );
}
