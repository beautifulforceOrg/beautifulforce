"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart } from "../lib/cart-context";
import { BagIcon, ChatIcon, HeartIcon, MenuIcon, SearchIcon, UserIcon, WhatsAppIcon } from "./icons";

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

// Real, current announcement copy from the live site.
const ANNOUNCEMENT = "FLAT 5% OFF ON SIGNING UP WITH BEAUTIFUL MESS";
const WHATSAPP_URL = "https://wa.me/+918088339455";
// The client's real logo file, read off the live site's own header.
const LOGO_URL = "https://beautifulmess.in/cdn/shop/files/BM_Logo.png?height=90&v=1720072314";

export function SiteHeader({ isLoggedIn }: { isLoggedIn: boolean }) {
  const { lines } = useCart();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const shopRef = useRef<HTMLDetailsElement>(null);
  const helpRef = useRef<HTMLDetailsElement>(null);
  const itemCount = lines.reduce((total, line) => total + line.quantity, 0);

  // Next.js Link navigation doesn't remount this header, so a native
  // <details> dropdown stays open after the route changes underneath it.
  // Close both whenever the path changes -- covers a click on any link
  // inside, not just a specific one.
  useEffect(() => {
    shopRef.current?.removeAttribute("open");
    helpRef.current?.removeAttribute("open");
    setMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <div
        role="region"
        aria-label="Announcement"
        className="bg-brand py-2 text-center text-xs font-medium uppercase tracking-wide text-brand-foreground"
      >
        {ANNOUNCEMENT}
      </div>

      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <button
            type="button"
            className="md:hidden"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <MenuIcon className="h-6 w-6 text-foreground" />
          </button>

          <nav className="hidden items-center gap-6 text-sm uppercase tracking-wide text-foreground md:flex">
            <Link href="/">Home</Link>
            <details ref={shopRef} className="group relative">
              <summary className="cursor-pointer list-none">Shop</summary>
              <div className="absolute left-0 top-full z-10 mt-2 w-56 rounded-[var(--sf-radius,0.5rem)] border border-border bg-background p-2 shadow-lg">
                {SHOP_LINKS.map((link) => (
                  <Link key={link.href} href={link.href} className="block rounded px-3 py-2 normal-case hover:bg-muted">
                    {link.label}
                  </Link>
                ))}
              </div>
            </details>
            <details ref={helpRef} className="group relative">
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

          <Link href="/" className="relative block h-12 w-32">
            <Image src={LOGO_URL} alt="Beautiful Mess" fill sizes="128px" className="object-contain" priority />
          </Link>

          <div className="flex items-center gap-4">
            <Link href="/shop" aria-label="Search the catalog" className="hidden sm:block">
              <SearchIcon className="h-5 w-5 text-brand" />
            </Link>
            <Link href="/help/contact" aria-label="Chat with us" className="hidden sm:block">
              <ChatIcon className="h-5 w-5 text-brand" />
            </Link>
            <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" aria-label="Message us on WhatsApp" className="hidden sm:block">
              <WhatsAppIcon className="h-5 w-5 text-brand" />
            </a>
            <Link href={isLoggedIn ? "/account" : "/account/login"} aria-label="My wishlist" className="hidden sm:block">
              <HeartIcon className="h-5 w-5 text-brand" />
            </Link>
            <Link
              href={isLoggedIn ? "/account" : "/account/login"}
              aria-label={isLoggedIn ? "My account" : "Log in"}
              className="hidden sm:block"
            >
              <UserIcon className="h-5 w-5 text-foreground" />
            </Link>
            <Link href="/cart" aria-label={`Cart, ${itemCount} items`} className="relative">
              <BagIcon className="h-5 w-5 text-foreground" />
              {itemCount > 0 ? (
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[10px] text-brand-foreground">
                  {itemCount}
                </span>
              ) : null}
            </Link>
          </div>
        </div>

        {menuOpen ? (
          <nav className="flex flex-col gap-1 border-t border-border px-6 py-4 text-sm uppercase tracking-wide text-foreground md:hidden">
            <Link href="/" onClick={() => setMenuOpen(false)}>
              Home
            </Link>
            {SHOP_LINKS.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
                {link.label}
              </Link>
            ))}
            {HELP_LINKS.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
                {link.label}
              </Link>
            ))}
            <Link href="/about" onClick={() => setMenuOpen(false)}>
              About Us
            </Link>
          </nav>
        ) : null}
      </header>
    </>
  );
}
