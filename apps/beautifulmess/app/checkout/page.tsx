"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CartSummary, formatPrice } from "@storeforge/ui";
import { placeOrder } from "../../lib/actions";
import { useCart } from "../../lib/cart-context";
import { applyDiscountCode } from "../../lib/discount";

export default function CheckoutPage() {
  const { lines, clear } = useCart();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [discountInput, setDiscountInput] = useState("");
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);

  const subtotal = lines.reduce((total, line) => total + line.price * line.quantity, 0);
  const discount = appliedCode ? applyDiscountCode(appliedCode, subtotal) : null;
  const total = discount?.valid ? subtotal - discount.amountOff : subtotal;

  function handleApplyDiscount() {
    const result = applyDiscountCode(discountInput, subtotal);
    if (!result.valid) {
      setDiscountError("That discount code isn't valid.");
      setAppliedCode(null);
      return;
    }
    setDiscountError(null);
    setAppliedCode(result.code);
  }

  function handlePlaceOrder() {
    setError(null);
    startTransition(async () => {
      try {
        const { gatewayOrderId } = await placeOrder(
          lines.map((line) => ({
            productId: line.productId,
            variantId: line.variantId,
            price: line.price,
            quantity: line.quantity,
          })),
          appliedCode ?? undefined
        );
        clear();
        router.push(`/orders/${gatewayOrderId}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      }
    });
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-heading mb-8 text-3xl uppercase text-foreground">Checkout</h1>
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

      <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-sm font-medium uppercase text-foreground">
        <span>Total</span>
        <span>{formatPrice(total)}</span>
      </div>

      {error ? (
        <p className="mt-4 text-sm" style={{ color: "#B91C1C" }}>
          {error}
        </p>
      ) : null}
      <button
        type="button"
        onClick={handlePlaceOrder}
        disabled={isPending || lines.length === 0}
        className="mt-6 rounded-[var(--sf-radius,0.5rem)] bg-brand px-6 py-3 text-sm font-medium uppercase text-brand-foreground disabled:opacity-50"
      >
        {isPending ? "Placing order..." : "Pay now"}
      </button>
    </main>
  );
}
