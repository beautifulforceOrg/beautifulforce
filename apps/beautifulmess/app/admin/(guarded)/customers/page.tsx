import { listCustomers } from "../../../../lib/admin/customers";

export default async function AdminCustomersPage() {
  const customers = await listCustomers();

  return (
    <main>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl text-foreground">Customers</h1>
        <a
          href="/api/admin/customers-csv"
          className="rounded-[var(--sf-radius,0.5rem)] bg-brand px-4 py-2 text-sm font-medium text-brand-foreground"
        >
          Export CSV
        </a>
      </div>
      <p className="mb-4 text-sm text-muted">
        {customers.length} customer{customers.length === 1 ? "" : "s"} -- export for WhatsApp/marketing campaigns.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Email</th>
              <th className="py-2 pr-4">Phone</th>
              <th className="py-2 pr-4">Orders</th>
              <th className="py-2 pr-4">Last order</th>
              <th className="py-2">Joined</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} className="border-b border-border">
                <td className="py-2 pr-4 text-foreground">{customer.name ?? "--"}</td>
                <td className="py-2 pr-4 text-foreground">{customer.email ?? "--"}</td>
                <td className="py-2 pr-4 text-foreground">{customer.phone ?? "--"}</td>
                <td className="py-2 pr-4 text-foreground">{customer.orderCount}</td>
                <td className="py-2 pr-4 text-foreground">
                  {customer.lastOrderAt ? customer.lastOrderAt.toLocaleDateString() : "--"}
                </td>
                <td className="py-2 text-foreground">{customer.createdAt.toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
