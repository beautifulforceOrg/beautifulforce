"use client";

import { useState, useTransition } from "react";
import type { TicketCategory } from "@storeforge/db";
import { createTicketAction } from "../actions";

const CATEGORIES: TicketCategory[] = ["BUG", "FEATURE", "CHANGE", "OTHER"];

export default function NewTicketPage() {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TicketCategory>("OTHER");
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    startTransition(() => createTicketAction({ subject, description, category }));
  }

  return (
    <main className="max-w-xl">
      <h2 className="font-heading mb-6 text-2xl uppercase text-foreground">New ticket</h2>
      <div className="flex flex-col gap-4">
        <label>
          <span className="mb-1 block text-xs font-medium uppercase text-muted">Subject</span>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-[var(--sf-radius,0.5rem)] border border-border px-3 py-2 text-sm text-foreground"
          />
        </label>
        <label>
          <span className="mb-1 block text-xs font-medium uppercase text-muted">Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as TicketCategory)}
            className="rounded-[var(--sf-radius,0.5rem)] border border-border px-3 py-2 text-sm text-foreground"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="mb-1 block text-xs font-medium uppercase text-muted">Description</span>
          <textarea
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-[var(--sf-radius,0.5rem)] border border-border px-3 py-2 text-sm text-foreground"
          />
        </label>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || !subject || !description}
          className="w-fit rounded-[var(--sf-radius,0.5rem)] bg-brand px-6 py-2.5 text-sm font-medium uppercase text-brand-foreground disabled:opacity-50"
        >
          {isPending ? "Creating..." : "Create ticket"}
        </button>
      </div>
    </main>
  );
}
