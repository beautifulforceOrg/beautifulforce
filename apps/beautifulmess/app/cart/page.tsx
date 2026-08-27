"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CartSummary } from "@storeforge/ui";
import { CatalogGrid, type CatalogProduct } from "../catalog-grid";
import { useCart } from "../../lib/cart-context";

export default function CartPage() {
  const { lines, increment, decrement, remove } = useCart();
  const [recommended, setRecommended] = useState<CatalogProduct[]>([]);

  useEffect(() => {
    if (lines.length > 0) return;
    fetch("/api/recommended")
      .then((res) => res.json())
      .then(setRecommended)
      .catch(() => {});
  }, [lines.length]);

  if (lines.length === 0) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-16 text-center">
        <h1 className="font-heading mb-4 text-3xl uppercase text-foreground">Your cart is empty</h1>
        <Link
          href="/shop"
          className="mt-2 inline-block rounded-[var(--sf-radius,0.5rem)] bg-brand px-6 py-3 text-sm font-medium uppercase text-brand-foreground"
        >
          Continue shopping
        </Link>

        {recommended.length > 0 ? (
          <div className="mt-16 text-left">
            <h2 className="font-heading mb-8 text-xl uppercase text-foreground">You may also like</h2>
            <CatalogGrid products={recommended} />
          </div>
        ) : null}
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-heading mb-8 text-3xl uppercase text-foreground">Your cart</h1>
      <CartSummary lines={lines} onIncrement={increment} onDecrement={decrement} onRemove={remove} />
      <Link
        href="/checkout"
        className="mt-6 inline-block rounded-[var(--sf-radius,0.5rem)] bg-brand px-6 py-3 text-sm font-medium uppercase text-brand-foreground"
      >
        Checkout
      </Link>
    </main>
  );
}
