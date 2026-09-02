import { db } from "@storeforge/db";

export interface CustomerListRow {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  createdAt: Date;
  orderCount: number;
  lastOrderAt: Date | null;
}

// The one place a real customer directory exists in this app -- needed
// for the store owner to run WhatsApp marketing campaigns, which no
// admin page previously supported. `phone` comes from the customer's
// default saved address (see lib/account-settings.ts's Address book) --
// a signed-up customer who's never checked out has no phone on file yet
// (see docs/technical-debt.md's Known Limitations).
export async function listCustomers(): Promise<CustomerListRow[]> {
  const customers = await db.customer.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      addresses: { where: { isDefault: true }, select: { phone: true }, take: 1 },
      orders: { select: { createdAt: true }, orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { orders: true } },
    },
  });

  return customers.map((customer) => ({
    id: customer.id,
    email: customer.email,
    name: customer.name,
    phone: customer.addresses[0]?.phone ?? null,
    createdAt: customer.createdAt,
    orderCount: customer._count.orders,
    lastOrderAt: customer.orders[0]?.createdAt ?? null,
  }));
}

/** CSV export for WhatsApp/marketing campaign tools -- name, email, phone, order count. */
export function customersToCsv(customers: CustomerListRow[]): string {
  const header = "Name,Email,Phone,Order Count,Last Order,Joined";
  const rows = customers.map((customer) =>
    [
      customer.name ?? "",
      customer.email,
      customer.phone ?? "",
      String(customer.orderCount),
      customer.lastOrderAt?.toISOString().slice(0, 10) ?? "",
      customer.createdAt.toISOString().slice(0, 10),
    ]
      .map((field) => `"${field.replace(/"/g, '""')}"`)
      .join(",")
  );
  return [header, ...rows].join("\n");
}
