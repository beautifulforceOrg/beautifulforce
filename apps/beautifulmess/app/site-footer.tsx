import Link from "next/link";
import { FacebookIcon, InstagramIcon } from "./icons";
import { TermsPoliciesPopover } from "./terms-policies-popover";

const FOR_YOU_LINKS = [
  { label: "Contact", href: "/help/contact" },
  { label: "Career & Partnership", href: "/help/careers" },
  { label: "Press & Events", href: "/help/press" },
  { label: "Franchise", href: "/help/franchise" },
  { label: "Gift Card", href: "/products/bm-gift-card" },
];

const INFO_LINKS = [
  { label: "Our Story", href: "/about" },
  { label: "Contact Us", href: "/help/contact" },
  { label: "Privacy Policy", href: "/policies/privacy" },
  { label: "Terms and Conditions", href: "/policies/terms" },
  { label: "No Exchange and Refunds", href: "/policies/refund" },
  { label: "Shipping & Delivery", href: "/policies/shipping" },
];

// Both verified directly from the live site's own footer markup (an
// audit read the real href attributes), not guessed.
const INSTAGRAM_URL = "https://www.instagram.com/beautifulmessbyann/";
const FACEBOOK_URL = "https://www.facebook.com/beautifulmessbyann";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-border bg-background text-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <h2 className="font-heading text-lg uppercase">Beautiful Mess</h2>
          <p className="mt-3 text-sm text-muted">
            102, Railway Parallel Road, 6th Cross,
            <br />
            Kumara Park West, Bengaluru,
            <br />
            Karnataka 560020
          </p>
          <p className="mt-3 text-sm text-muted">
            +91 8088339455
            <br />
            online.beautifulmess@gmail.com
          </p>
          <div className="-ml-2.5 mt-4 flex items-center gap-1">
            <a href={FACEBOOK_URL} target="_blank" rel="noreferrer" aria-label="Beautiful Mess on Facebook" className="p-2.5">
              <FacebookIcon className="h-5 w-5 text-muted hover:text-brand" />
            </a>
            <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" aria-label="Beautiful Mess on Instagram" className="p-2.5">
              <InstagramIcon className="h-5 w-5 text-muted hover:text-brand" />
            </a>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide">For You</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            {FOR_YOU_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-foreground">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide">Info Links</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            {INFO_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-foreground">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide">Subscribe to our email</h3>
          <form
            className="mt-3 flex border-b border-border pb-1"
            action="mailto:online.beautifulmess@gmail.com"
            method="post"
            encType="text/plain"
          >
            <input
              type="email"
              name="email"
              required
              placeholder="Email address"
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
            />
            <button type="submit" aria-label="Subscribe" className="-mr-2.5 p-2.5 text-brand">
              &rarr;
            </button>
          </form>
          <p className="mt-3 text-sm text-muted">
            Every piece we choose and create is crafted with care, blending style with comfort. We&apos;re
            proud to use the softest materials that kids adore.
          </p>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 text-xs text-muted">
          <span>© {year} Beautifulmessstore</span>
          <TermsPoliciesPopover />
        </div>
      </div>
    </footer>
  );
}
