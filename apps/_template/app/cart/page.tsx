"use client";

import Link from "next/link";
import { CartSummary } from "@storeforge/ui";
import { useCart } from "../../lib/cart-context";

export default function CartPage() {
  const { lines, increment, decrement, remove } = useCart();

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 text-2xl font-semibold text-foreground">Your cart</h1>
      {lines.length === 0 ? (
        <p className="text-muted">Your cart is empty.</p>
      ) : (
        <>
          <CartSummary lines={lines} onIncrement={increment} onDecrement={decrement} onRemove={remove} />
          <Link
            href="/checkout"
            className="mt-6 inline-block rounded-[var(--sf-radius,0.5rem)] bg-brand px-4 py-2 text-brand-foreground"
          >
            Checkout
          </Link>
        </>
      )}
    </main>
  );
}
