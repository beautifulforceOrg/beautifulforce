"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart } from "../lib/cart-context";
import { BagIcon, ChatIcon, HeartIcon, MenuIcon, SearchIcon, UserIcon, WhatsAppIcon } from "./icons";

// "Gift Hampers" removed -- there's no real gift-hamper catalog content
// yet (the only gift-card product already has its own link under Help).
const SHOP_LINKS = [
  { label: "Apparel (Frocks)", href: "/shop/frocks" },
  { label: "Accessories (Bags)", href: "/shop/bags" },
];

const HELP_LINKS = [
  { label: "Contact", href: "/help/contact" },
  { label: "Career & Partnerships", href: "/help/careers" },
  { label: "Press & Events", href: "/help/press" },
  { label: "Franchise", href: "/help/franchise" },
  { label: "Gift Card", href: "/products/bm-gift-card" },
];

// The real site's own announcement-bar slideshow: 3 real messages
// (one is the client's own typo, "LILL ANGLES", kept verbatim rather
// than silently corrected) that rotate automatically with manual
// prev/next controls, same as the live site's slideshow-slide markup.
const ANNOUNCEMENTS = [
  "FLAT 5% OFF ON SIGNING UP WITH BEAUTIFUL MESS",
  "STYLED OVER 20,000 + LILL ANGLES",
  "SHIPPING HAPPINESS GLOBALLY",
];
const WHATSAPP_URL = "https://wa.me/+918088339455";
// The client's real logo file, re-hosted on our own ImageKit account
// (scripts/migrate-images-to-imagekit.ts) rather than hotlinked from the
// client's Shopify CDN.
const LOGO_URL = "https://ik.imagekit.io/beautifulforce/beautifulmess/BM_Logo.png";

export function SiteHeader({ isLoggedIn, isAdmin }: { isLoggedIn: boolean; isAdmin: boolean }) {
  const { lines } = useCart();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [announcementIndex, setAnnouncementIndex] = useState(0);
  const shopRef = useRef<HTMLDetailsElement>(null);
  const helpRef = useRef<HTMLDetailsElement>(null);
  const itemCount = lines.reduce((total, line) => total + line.quantity, 0);

  useEffect(() => {
    const timer = setInterval(() => {
      setAnnouncementIndex((i) => (i + 1) % ANNOUNCEMENTS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

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
        className="flex items-center justify-center gap-3 bg-brand py-2 text-center text-xs font-medium uppercase tracking-wide text-brand-foreground"
      >
        <button
          type="button"
          aria-label="Previous announcement"
          onClick={() => setAnnouncementIndex((i) => (i - 1 + ANNOUNCEMENTS.length) % ANNOUNCEMENTS.length)}
          className="px-3 py-3 opacity-75 hover:opacity-100"
        >
          &lsaquo;
        </button>
        <span>{ANNOUNCEMENTS[announcementIndex]}</span>
        <button
          type="button"
          aria-label="Next announcement"
          onClick={() => setAnnouncementIndex((i) => (i + 1) % ANNOUNCEMENTS.length)}
          className="px-3 py-3 opacity-75 hover:opacity-100"
        >
          &rsaquo;
        </button>
      </div>

      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <button
            type="button"
            className="-m-2 p-2 md:hidden"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <MenuIcon className="h-6 w-6 text-foreground" />
          </button>

          <nav aria-label="Main" className="hidden items-center gap-6 text-sm uppercase tracking-wide text-foreground md:flex">
            <Link href="/">Home</Link>
            {/* Shared `name` makes these two native <details> mutually
                exclusive -- opening one closes the other, same as the
                real site's dropdowns. */}
            <details ref={shopRef} name="site-nav-dropdown" className="group relative">
              <summary className="cursor-pointer list-none">Shop</summary>
              <div className="absolute left-0 top-full z-10 mt-2 w-56 rounded-[var(--sf-radius,0.5rem)] border border-border bg-background p-2 shadow-lg">
                {SHOP_LINKS.map((link) => (
                  <Link key={link.href} href={link.href} className="block rounded px-3 py-2 normal-case hover:bg-muted">
                    {link.label}
                  </Link>
                ))}
              </div>
            </details>
            <details ref={helpRef} name="site-nav-dropdown" className="group relative">
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
            {isAdmin ? (
              // Opens in a new tab (not a redirect of the current page) --
              // an admin is usually mid-shop or mid-task on the storefront
              // tab and shouldn't lose that to jump into the dashboard.
              // /admin/enter re-authenticates using the existing customer
              // session, no second password prompt.
              <a href="/admin/enter" target="_blank" rel="noreferrer">
                Admin
              </a>
            ) : null}
          </nav>

          <Link href="/" className="relative block h-12 w-32">
            <Image
              src={LOGO_URL}
              alt="Beautiful Mess"
              fill
              sizes="128px"
              className="object-contain"
              priority
              fetchPriority="high"
            />
          </Link>

          <div className="flex items-center gap-1">
            <Link href="/search" aria-label="Search the catalog" className="hidden p-2.5 sm:block">
              <SearchIcon className="h-5 w-5 text-brand" />
            </Link>
            <Link href="/help/contact" aria-label="Chat with us" className="hidden p-2.5 sm:block">
              <ChatIcon className="h-5 w-5 text-brand" />
            </Link>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="Message us on WhatsApp"
              className="hidden p-2.5 sm:block"
            >
              <WhatsAppIcon className="h-5 w-5 text-brand" />
            </a>
            <Link href={isLoggedIn ? "/account" : "/account/login"} aria-label="My wishlist" className="hidden p-2.5 sm:block">
              <HeartIcon className="h-5 w-5 text-brand" />
            </Link>
            <Link
              href={isLoggedIn ? "/account" : "/account/login"}
              aria-label={isLoggedIn ? "My account" : "Log in"}
              className="hidden p-2.5 sm:block"
            >
              <UserIcon className="h-5 w-5 text-foreground" />
            </Link>
            <Link href="/cart" aria-label={`Cart, ${itemCount} items`} className="relative p-2.5">
              <BagIcon className="h-5 w-5 text-foreground" />
              {itemCount > 0 ? (
                <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[10px] text-brand-foreground">
                  {itemCount}
                </span>
              ) : null}
            </Link>
          </div>
        </div>

        {menuOpen ? (
          <nav aria-label="Mobile" className="flex flex-col border-t border-border px-6 py-2 text-sm uppercase tracking-wide text-foreground md:hidden">
            <Link className="py-3" href="/" onClick={() => setMenuOpen(false)}>
              Home
            </Link>
            {SHOP_LINKS.map((link) => (
              <Link className="py-3" key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
                {link.label}
              </Link>
            ))}
            {HELP_LINKS.map((link) => (
              <Link className="py-3" key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
                {link.label}
              </Link>
            ))}
            <Link className="py-3" href="/about" onClick={() => setMenuOpen(false)}>
              About Us
            </Link>
            {isAdmin ? (
              <a className="py-3" href="/admin/enter" target="_blank" rel="noreferrer">
                Admin
              </a>
            ) : null}
          </nav>
        ) : null}
      </header>
    </>
  );
}
