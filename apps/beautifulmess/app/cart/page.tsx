"use client";

import Link from "next/link";
import { CartSummary } from "@storeforge/ui";
import { useCart } from "../../lib/cart-context";

export default function CartPage() {
  const { lines, increment, decrement, remove } = useCart();

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-heading mb-8 text-3xl uppercase text-foreground">Your cart</h1>
      {lines.length === 0 ? (
        <p className="text-muted">
          Your cart is empty.{" "}
          <Link href="/shop" className="text-brand underline">
            Continue shopping
          </Link>
          .
        </p>
      ) : (
        <>
          <CartSummary lines={lines} onIncrement={increment} onDecrement={decrement} onRemove={remove} />
          <Link
            href="/checkout"
            className="mt-6 inline-block rounded-[var(--sf-radius,0.5rem)] bg-brand px-6 py-3 text-sm font-medium uppercase text-brand-foreground"
          >
            Checkout
          </Link>
        </>
      )}
    </main>
  );
}
