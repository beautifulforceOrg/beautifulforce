"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { AddressForm, CartSummary, formatPrice, type AddressValue } from "@storeforge/ui";
import { getCheckoutAddressData } from "../../lib/account-actions";
import type { SavedAddress } from "../../lib/account-settings";
import { placeOrder } from "../../lib/actions";
import { useCart } from "../../lib/cart-context";
import { previewDiscountCode } from "../../lib/discount-actions";
import type { DiscountResult } from "../../lib/discount";
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

// A real saved address's id, or this sentinel for "enter a new one" --
// keeps the picker's selection state to one variable instead of two.
const NEW_ADDRESS = "__new__";

function toAddressValue(saved: SavedAddress, email: string): AddressValue {
  return {
    name: saved.name,
    email,
    phone: saved.phone,
    addressLine1: saved.addressLine1,
    addressLine2: saved.addressLine2,
    city: saved.city,
    state: saved.state,
    pincode: saved.pincode,
  };
}

export default function CheckoutPage() {
  const { lines, clear } = useCart();
  const router = useRouter();
  const [address, setAddress] = useState<AddressValue>(EMPTY_ADDRESS);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>(NEW_ADDRESS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [discountInput, setDiscountInput] = useState("");
  const [discount, setDiscount] = useState<DiscountResult | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);

  // Prefills a returning logged-in customer's saved address book (see
  // lib/account-settings.ts) so they don't retype it every order -- a
  // no-op (resolves null) for guests or a customer who's never checked
  // out before, who just see the plain address form.
  useEffect(() => {
    getCheckoutAddressData().then((data) => {
      if (!data) return;
      setSavedAddresses(data.addresses);
      const defaultAddress = data.addresses[0];
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
        setAddress(toAddressValue(defaultAddress, data.email));
      } else {
        setAddress((current) => ({ ...current, email: data.email }));
      }
    });
  }, []);

  function handleSelectAddress(id: string, email: string) {
    setSelectedAddressId(id);
    if (id === NEW_ADDRESS) {
      setAddress({ ...EMPTY_ADDRESS, email });
      return;
    }
    const saved = savedAddresses.find((a) => a.id === id);
    if (saved) setAddress(toAddressValue(saved, email));
  }

  const subtotal = lines.reduce((total, line) => total + line.price * line.quantity, 0);
  const total = discount?.valid ? subtotal - discount.amountOff : subtotal;

  function handleApplyDiscount() {
    previewDiscountCode(discountInput, subtotal).then((result) => {
      if (!result.valid) {
        setDiscountError("That discount code isn't valid.");
        setDiscount(null);
        return;
      }
      setDiscountError(null);
      setDiscount(result);
    });
  }

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
        discount?.valid ? discount.code : undefined,
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
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <h1 className="font-heading mb-8 text-3xl text-foreground">Checkout</h1>
      <CartSummary lines={lines} />

      <div className="mt-6 flex gap-2">
        <input
          type="text"
          value={discountInput}
          onChange={(e) => setDiscountInput(e.target.value)}
          placeholder="Discount code"
          aria-label="Discount code"
          className="flex-1 rounded-[var(--sf-radius,0.5rem)] border border-border px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted"
        />
        <button
          type="button"
          onClick={handleApplyDiscount}
          className="rounded-[var(--sf-radius,0.5rem)] border border-brand px-4 py-2 text-sm font-medium uppercase text-brand"
        >
          Apply
        </button>
      </div>
      {discountError ? (
        <p className="mt-2 text-sm" style={{ color: "#B91C1C" }}>
          {discountError}
        </p>
      ) : null}
      {discount?.valid ? (
        <p className="mt-2 text-sm text-brand">
          {discount.code} applied &mdash; {discount.percentOff * 100}% off ({formatPrice(discount.amountOff)})
        </p>
      ) : null}

      <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-sm font-medium text-foreground">
        <span>Total</span>
        <span>{formatPrice(total)}</span>
      </div>

      <div className="mt-8">
        {savedAddresses.length > 0 ? (
          <fieldset className="mb-6 space-y-2">
            <legend className="mb-2 text-sm font-medium text-foreground">Delivery address</legend>
            {savedAddresses.map((saved) => (
              <label
                key={saved.id}
                className="flex cursor-pointer items-start gap-2 rounded-[var(--sf-radius,0.5rem)] border border-border p-3 text-sm text-foreground"
              >
                <input
                  type="radio"
                  name="savedAddress"
                  checked={selectedAddressId === saved.id}
                  onChange={() => handleSelectAddress(saved.id, address.email)}
                />
                <span>
                  <span className="font-medium">{saved.label}</span> &mdash; {saved.name}, {saved.addressLine1},{" "}
                  {saved.city}, {saved.state} {saved.pincode}
                </span>
              </label>
            ))}
            <label className="flex cursor-pointer items-center gap-2 rounded-[var(--sf-radius,0.5rem)] border border-border p-3 text-sm text-foreground">
              <input
                type="radio"
                name="savedAddress"
                checked={selectedAddressId === NEW_ADDRESS}
                onChange={() => handleSelectAddress(NEW_ADDRESS, address.email)}
              />
              Use a new address
            </label>
          </fieldset>
        ) : null}

        {selectedAddressId === NEW_ADDRESS ? (
          <AddressForm
            value={address}
            onChange={setAddress}
            googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
          />
        ) : null}
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
        className="mt-6 rounded-[var(--sf-radius,0.5rem)] bg-brand px-6 py-3 text-sm font-medium uppercase text-brand-foreground disabled:opacity-50"
      >
        {isSubmitting ? "Placing order..." : "Pay now"}
      </button>
    </main>
  );
}
