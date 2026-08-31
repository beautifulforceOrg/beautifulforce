import Link from "next/link";
import type { ReactNode } from "react";
import { ToastProvider } from "@storeforge/ui";
import { requireAdmin } from "../../../lib/admin/auth";
import { adminLogOut } from "../../../lib/admin/actions";

const NAV_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/discounts", label: "Discounts" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/contact", label: "Contact" },
  { href: "/admin/tickets", label: "Tickets" },
];

export default async function AdminGuardedLayout({ children }: { children: ReactNode }) {
  await requireAdmin();

  return (
    <ToastProvider>
      <div className="mx-auto flex min-h-screen max-w-6xl gap-8 px-6 py-10">
        <aside className="w-48 shrink-0">
          <h1 className="font-heading mb-6 text-lg uppercase text-foreground">Store admin</h1>
          <nav className="flex flex-col gap-2 text-sm">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="text-foreground hover:text-brand">
                {link.label}
              </Link>
            ))}
          </nav>
          <form action={adminLogOut} className="mt-8">
            <button type="submit" className="text-sm text-muted underline">
              Log out
            </button>
          </form>
        </aside>
        <div className="flex-1">{children}</div>
      </div>
    </ToastProvider>
  );
}
