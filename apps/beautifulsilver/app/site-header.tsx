"use client";

import Link from "next/link";
import { useCart } from "../lib/cart-context";

const COLLECTIONS = [
  { slug: "rings", name: "Rings" },
  { slug: "chains-and-necklaces", name: "Chains & Necklaces" },
  { slug: "earrings", name: "Earrings" },
  { slug: "bangles-and-bracelets", name: "Bangles & Bracelets" },
  { slug: "anklets", name: "Anklets" },
];

export function SiteHeader() {
  const { lines } = useCart();
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-8 py-4">
        <Link href="/" className="font-heading text-xl font-semibold tracking-wide text-foreground">
          Beautiful Silver
        </Link>
        <nav aria-label="Collections" className="hidden gap-4 text-sm text-foreground sm:flex">
          {COLLECTIONS.map((collection) => (
            <Link key={collection.slug} href={`/collections/${collection.slug}`} className="hover:text-brand">
              {collection.name}
            </Link>
          ))}
        </nav>
        <Link href="/cart" className="text-sm font-medium text-foreground">
          Cart{itemCount > 0 ? ` (${itemCount})` : ""}
        </Link>
      </div>
    </header>
  );
}
