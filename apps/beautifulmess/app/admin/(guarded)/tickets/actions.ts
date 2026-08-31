"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { TicketCategory, TicketStatus } from "@storeforge/db";
import { requireAdminOrThrow } from "../../../../lib/admin/auth";
import { addTicketComment, createTicket, setTicketStatus } from "../../../../lib/admin/tickets";

export async function createTicketAction(input: {
  subject: string;
  description: string;
  category: TicketCategory;
}): Promise<void> {
  const adminId = await requireAdminOrThrow();
  const ticket = await createTicket(adminId, input);
  revalidatePath("/admin/tickets");
  redirect(`/admin/tickets/${ticket.id}`);
}

export async function addTicketCommentAction(ticketId: string, body: string): Promise<void> {
  const adminId = await requireAdminOrThrow();
  await addTicketComment(ticketId, adminId, body);
  revalidatePath(`/admin/tickets/${ticketId}`);
}

export async function setTicketStatusAction(ticketId: string, status: TicketStatus): Promise<void> {
  await requireAdminOrThrow();
  await setTicketStatus(ticketId, status);
  revalidatePath(`/admin/tickets/${ticketId}`);
}
