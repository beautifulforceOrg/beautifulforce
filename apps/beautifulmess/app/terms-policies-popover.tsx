"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// The real site's footer bottom bar opens a small popover with these five
// links rather than linking straight to one policy.
const POLICY_LINKS = [
  { label: "Privacy policy", href: "/policies/privacy" },
  { label: "Terms of service", href: "/policies/terms" },
  { label: "Refund policy", href: "/policies/refund" },
  { label: "Contact information", href: "/help/contact" },
  { label: "Shipping policy", href: "/policies/shipping" },
];

export function TermsPoliciesPopover() {
  const pathname = usePathname();
  const ref = useRef<HTMLDetailsElement>(null);

  // Same fix as app/site-header.tsx's Shop/Help dropdowns: Next.js Link
  // navigation doesn't remount this component, so a native <details>
  // stays open across a route change unless closed explicitly.
  useEffect(() => {
    ref.current?.removeAttribute("open");
  }, [pathname]);

  return (
    <details ref={ref} className="group relative">
      <summary className="-my-2 cursor-pointer list-none py-2 hover:text-foreground">Terms and Policies</summary>
      <div className="absolute bottom-full right-0 z-10 mb-2 w-52 rounded-[var(--sf-radius,0.5rem)] border border-border bg-background p-2 shadow-lg">
        <ul>
          {POLICY_LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="block rounded px-3 py-2 text-sm normal-case text-foreground hover:bg-muted">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
