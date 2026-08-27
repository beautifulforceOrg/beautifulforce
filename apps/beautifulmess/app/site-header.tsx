"use client";

import Link from "next/link";
import { useCart } from "../lib/cart-context";

const SHOP_LINKS = [
  { label: "Apparel (Frocks)", href: "/shop/frocks" },
  { label: "Accessories (Bags)", href: "/shop/bags" },
  { label: "Gift Hampers", href: "/products/bm-gift-card" },
];

const HELP_LINKS = [
  { label: "Contact", href: "/help/contact" },
  { label: "Career & Partnerships", href: "/help/careers" },
  { label: "Press & Events", href: "/help/press" },
  { label: "Franchise", href: "/help/franchise" },
  { label: "Gift Card", href: "/products/bm-gift-card" },
];

export function SiteHeader() {
  const { lines } = useCart();
  const itemCount = lines.reduce((total, line) => total + line.quantity, 0);

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="font-heading text-2xl uppercase tracking-wide text-foreground">
          Beautiful Mess
        </Link>

        <nav className="hidden items-center gap-6 text-sm uppercase tracking-wide text-foreground md:flex">
          <Link href="/">Home</Link>

          <details className="group relative">
            <summary className="cursor-pointer list-none">Shop</summary>
            <div className="absolute left-0 top-full z-10 mt-2 w-56 rounded-[var(--sf-radius,0.5rem)] border border-border bg-background p-2 shadow-lg">
              {SHOP_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="block rounded px-3 py-2 normal-case hover:bg-muted">
                  {link.label}
                </Link>
              ))}
            </div>
          </details>

          <details className="group relative">
            <summary className="cursor-pointer list-none">Help</summary>
            <div className="absolute left-0 top-full z-10 mt-2 w-56 rounded-[var(--sf-radius,0.5rem)] border border-border bg-background p-2 shadow-lg">
              {HELP_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="block rounded px-3 py-2 normal-case hover:bg-muted">
                  {link.label}
                </Link>
              ))}
            </div>
          </details>

          <Link href="/about">About Us</Link>
        </nav>

        <Link href="/cart" className="text-sm font-medium text-foreground" aria-label={`Cart, ${itemCount} items`}>
          Cart ({itemCount})
        </Link>
      </div>
    </header>
  );
}
