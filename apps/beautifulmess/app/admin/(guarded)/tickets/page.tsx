import Link from "next/link";
import { DataTable } from "@storeforge/ui";
import { listTickets } from "../../../../lib/admin/tickets";

export default async function AdminTicketsPage() {
  const tickets = await listTickets();

  return (
    <main>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-heading text-2xl uppercase text-foreground">Tickets</h2>
        <Link
          href="/admin/tickets/new"
          className="rounded-[var(--sf-radius,0.5rem)] bg-brand px-4 py-2 text-sm font-medium uppercase text-brand-foreground"
        >
          New ticket
        </Link>
      </div>
      <DataTable
        rowKey={(ticket) => ticket.id}
        rows={tickets}
        columns={[
          {
            header: "Subject",
            cell: (ticket) => (
              <Link href={`/admin/tickets/${ticket.id}`} className="text-brand underline">
                {ticket.subject}
              </Link>
            ),
          },
          { header: "Category", cell: (ticket) => ticket.category },
          { header: "Status", cell: (ticket) => ticket.status },
          { header: "Filed by", cell: (ticket) => ticket.createdBy.email },
          { header: "Updated", cell: (ticket) => ticket.updatedAt.toLocaleDateString() },
        ]}
        emptyMessage="No tickets yet."
      />
    </main>
  );
}
