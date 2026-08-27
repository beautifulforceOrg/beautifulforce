import Link from "next/link";

const FOR_YOU_LINKS = [
  { label: "Shop", href: "/shop" },
  { label: "About Us", href: "/about" },
  { label: "Gift Cards", href: "/products/bm-gift-card" },
];

const INFO_LINKS = [
  { label: "Privacy Policy", href: "/policies/privacy" },
  { label: "Terms of Service", href: "/policies/terms" },
  { label: "Refund Policy", href: "/policies/refund" },
  { label: "Contact Information", href: "/help/contact" },
  { label: "Shipping Policy", href: "/policies/shipping" },
];

export function SiteFooter() {
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
          <p className="mt-3 text-sm text-muted">12:00PM - 7:00PM · Sunday Holiday</p>
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
          <h3 className="text-sm font-semibold uppercase tracking-wide">Stay in touch</h3>
          <p className="mt-3 text-sm text-muted">
            Worldwide shipping · Curated pieces · Secure payments
          </p>
        </div>
      </div>
    </footer>
  );
}
