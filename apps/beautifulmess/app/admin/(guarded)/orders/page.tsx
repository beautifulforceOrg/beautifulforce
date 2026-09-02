import Link from "next/link";
import { DataTable } from "@storeforge/ui";
import { listOrders } from "../../../../lib/admin/orders";
import type { OrderStatus } from "@storeforge/db";

const STATUSES: OrderStatus[] = ["PENDING", "PAID", "FULFILLED", "CANCELLED"];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status, q } = await searchParams;
  const orders = await listOrders({
    status: status && STATUSES.includes(status as OrderStatus) ? (status as OrderStatus) : undefined,
    search: q,
  });

  return (
    <main>
      <h2 className="font-heading mb-6 text-2xl uppercase text-foreground">Orders</h2>

      <form className="mb-4 flex flex-wrap gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by order id, name, or email"
          className="w-full max-w-sm rounded-[var(--sf-radius,0.5rem)] border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted"
        />
        <select
          name="status"
          aria-label="Filter by status"
          defaultValue={status ?? ""}
          className="rounded-[var(--sf-radius,0.5rem)] border border-border px-3 py-2 text-sm text-foreground"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-[var(--sf-radius,0.5rem)] border border-brand px-4 py-2 text-sm text-brand">
          Filter
        </button>
      </form>

      <DataTable
        rowKey={(order) => order.id}
        rows={orders}
        columns={[
          {
            header: "Order",
            cell: (order) => (
              <Link href={`/admin/orders/${order.id}`} className="text-brand underline">
                {order.gatewayOrderId ?? order.id}
              </Link>
            ),
          },
          { header: "Customer", cell: (order) => order.shipToName ?? order.customer?.email ?? "Guest" },
          { header: "Status", cell: (order) => order.status },
          { header: "Items", cell: (order) => String(order.items.length), align: "right" },
          { header: "Placed", cell: (order) => order.createdAt.toLocaleDateString() },
        ]}
        emptyMessage="No orders match."
      />
    </main>
  );
}
