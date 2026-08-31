import { db, type TicketCategory, type TicketStatus } from "@storeforge/db";

export interface TicketFilters {
  status?: TicketStatus;
  category?: TicketCategory;
}

export async function listTickets(filters: TicketFilters = {}) {
  return db.ticket.findMany({
    where: { status: filters.status, category: filters.category },
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { email: true } } },
  });
}

export async function getTicket(id: string) {
  return db.ticket.findUnique({
    where: { id },
    include: {
      createdBy: { select: { email: true } },
      comments: { orderBy: { createdAt: "asc" }, include: { author: { select: { email: true } } } },
    },
  });
}

export async function createTicket(
  createdById: string,
  input: { subject: string; description: string; category: TicketCategory }
): Promise<{ id: string }> {
  const ticket = await db.ticket.create({
    data: { subject: input.subject, description: input.description, category: input.category, createdById },
  });
  return { id: ticket.id };
}

export async function addTicketComment(ticketId: string, authorId: string, body: string): Promise<void> {
  await db.ticketComment.create({ data: { ticketId, authorId, body } });
  await db.ticket.update({ where: { id: ticketId }, data: { updatedAt: new Date() } });
}

export async function setTicketStatus(id: string, status: TicketStatus): Promise<void> {
  await db.ticket.update({ where: { id }, data: { status } });
}
