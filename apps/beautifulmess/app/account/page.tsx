import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { db } from "@storeforge/db";
import { formatPrice } from "@storeforge/ui";
import { getSessionCustomerId } from "../../lib/auth";
import { logOut } from "../../lib/account-actions";

export default async function AccountPage() {
  const customerId = await getSessionCustomerId();
  if (!customerId) {
    redirect("/account/login");
  }

  const customer = await db.customer.findUnique({
    where: { id: customerId },
    include: {
      orders: { orderBy: { createdAt: "desc" }, include: { items: true } },
      wishlist: { include: { product: { include: { images: { take: 1, orderBy: { position: "asc" } } } } } },
    },
  });

  if (!customer) {
    redirect("/account/login");
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl text-foreground">
          {customer.name ? `Hi, ${customer.name}` : "My Account"}
        </h1>
        <form action={logOut}>
          <button type="submit" className="text-sm text-brand underline">
            Log out
          </button>
        </form>
      </div>
      <p className="mt-1 text-sm text-muted">{customer.email ?? ""}</p>
      <p className="mt-2 text-sm">
        <Link href="/account/settings" className="text-brand underline">
          Account settings
        </Link>
      </p>

      <h2 className="font-heading mb-4 mt-10 text-xl text-foreground">Order history</h2>
      {customer.orders.length === 0 ? (
        <p className="text-sm text-muted">
          No orders yet.{" "}
          <Link href="/shop" className="text-brand underline">
            Start shopping
          </Link>
          .
        </p>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {customer.orders.map((order) => (
            <li key={order.id} className="flex items-center justify-between py-3 text-sm">
              <Link href={`/orders/${order.gatewayOrderId}`} className="text-brand underline">
                {order.gatewayOrderId}
              </Link>
              <span className="text-muted">{order.items.length} item(s)</span>
              <span className="text-foreground">{order.status}</span>
            </li>
          ))}
        </ul>
      )}

      <h2 className="font-heading mb-4 mt-10 text-xl text-foreground">Wishlist</h2>
      {customer.wishlist.length === 0 ? (
        <p className="text-sm text-muted">Nothing saved yet -- tap the heart on any product to add it here.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {customer.wishlist.map((item) => (
            <Link key={item.id} href={`/products/${item.product.slug}`} className="block">
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[var(--sf-radius,0.5rem)] bg-muted">
                {item.product.images[0] ? (
                  <Image
                    src={item.product.images[0].url}
                    alt={item.product.name}
                    fill
                    sizes="33vw"
                    className="object-cover"
                  />
                ) : null}
              </div>
              <span className="mt-2 block text-center text-sm text-brand">{item.product.name}</span>
              <span className="block text-center text-sm text-foreground">{formatPrice(item.product.price)}</span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
