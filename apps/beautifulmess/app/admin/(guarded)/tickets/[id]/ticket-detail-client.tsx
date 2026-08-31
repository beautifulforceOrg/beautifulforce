"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { TicketStatus } from "@storeforge/db";
import { useToast } from "@storeforge/ui";
import type { getTicket } from "../../../../../lib/admin/tickets";
import { addTicketCommentAction, setTicketStatusAction } from "../actions";

const STATUSES: TicketStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

type Ticket = NonNullable<Awaited<ReturnType<typeof getTicket>>>;

export function TicketDetailClient({ ticket }: { ticket: Ticket }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [status, setStatus] = useState<TicketStatus>(ticket.status);
  const [comment, setComment] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(next: TicketStatus) {
    setStatus(next);
    startTransition(async () => {
      await setTicketStatusAction(ticket.id, next);
      showToast("Ticket status updated.");
      router.refresh();
    });
  }

  function handleAddComment() {
    startTransition(async () => {
      await addTicketCommentAction(ticket.id, comment);
      setComment("");
      router.refresh();
    });
  }

  return (
    <main className="flex max-w-2xl flex-col gap-6">
      <div>
        <h2 className="font-heading text-2xl uppercase text-foreground">{ticket.subject}</h2>
        <p className="text-sm text-muted">
          {ticket.category} · filed by {ticket.createdBy.email} on {ticket.createdAt.toLocaleString()}
        </p>
      </div>

      <p className="whitespace-pre-wrap text-sm text-foreground">{ticket.description}</p>

      <div className="flex items-center gap-3">
        <label htmlFor="ticket-status-select" className="text-sm font-medium text-foreground">
          Status
        </label>
        <select
          id="ticket-status-select"
          value={status}
          disabled={isPending}
          onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
          className="rounded-[var(--sf-radius,0.5rem)] border border-border px-3 py-2 text-sm text-foreground"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <section>
        <h3 className="font-heading mb-3 text-lg uppercase text-foreground">Comments</h3>
        <ul className="mb-4 flex flex-col gap-3">
          {ticket.comments.map((c) => (
            <li key={c.id} className="border-b border-border pb-2 text-sm">
              <p className="font-medium text-foreground">
                {c.author.email} <span className="font-normal text-muted">— {c.createdAt.toLocaleString()}</span>
              </p>
              <p className="text-foreground">{c.body}</p>
            </li>
          ))}
          {ticket.comments.length === 0 ? <p className="text-muted">No comments yet.</p> : null}
        </ul>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a comment"
          rows={3}
          className="w-full rounded-[var(--sf-radius,0.5rem)] border border-border px-3 py-2 text-sm text-foreground"
        />
        <button
          type="button"
          onClick={handleAddComment}
          disabled={isPending || !comment}
          className="mt-2 rounded-[var(--sf-radius,0.5rem)] bg-brand px-4 py-2 text-sm font-medium uppercase text-brand-foreground disabled:opacity-50"
        >
          Add comment
        </button>
      </section>
    </main>
  );
}
