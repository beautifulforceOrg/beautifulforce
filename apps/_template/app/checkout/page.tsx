"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CartSummary } from "@storeforge/ui";
import { placeOrder } from "../../lib/actions";
import { useCart } from "../../lib/cart-context";

export default function CheckoutPage() {
  const { lines, clear } = useCart();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handlePlaceOrder() {
    setError(null);
    startTransition(async () => {
      try {
        const { gatewayOrderId } = await placeOrder(
          lines.map((line) => ({ productId: line.productId, price: line.price, quantity: line.quantity }))
        );
        clear();
        router.push(`/orders/${gatewayOrderId}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      }
    });
  }

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 text-2xl font-semibold text-foreground">Checkout</h1>
      <CartSummary lines={lines} />
      {error ? (
        <p className="mt-4 text-sm" style={{ color: "#B91C1C" }}>
          {error}
        </p>
      ) : null}
      <button
        type="button"
        onClick={handlePlaceOrder}
        disabled={isPending || lines.length === 0}
        className="mt-6 rounded-[var(--sf-radius,0.5rem)] bg-brand px-4 py-2 text-brand-foreground disabled:opacity-50"
      >
        {isPending ? "Placing order..." : "Pay now"}
      </button>
    </main>
  );
}
