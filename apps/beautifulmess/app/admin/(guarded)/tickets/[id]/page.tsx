import { notFound } from "next/navigation";
import { getTicket } from "../../../../../lib/admin/tickets";
import { TicketDetailClient } from "./ticket-detail-client";

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ticket = await getTicket(id);
  if (!ticket) notFound();

  return <TicketDetailClient ticket={ticket} />;
}
