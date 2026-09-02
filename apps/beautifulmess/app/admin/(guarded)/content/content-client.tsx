"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { DataTable, useToast } from "@storeforge/ui";
import type { listFaqItems, listTestimonials } from "../../../../lib/admin/content";
import {
  createFaqItemAction,
  createTestimonialAction,
  deleteFaqItemAction,
  deleteTestimonialAction,
} from "./actions";

type Testimonial = Awaited<ReturnType<typeof listTestimonials>>[number];
type FaqItem = Awaited<ReturnType<typeof listFaqItems>>[number];

export function ContentClient({
  initialTestimonials,
  initialFaqItems,
}: {
  initialTestimonials: Testimonial[];
  initialFaqItems: FaqItem[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [testimonialName, setTestimonialName] = useState("");
  const [testimonialQuote, setTestimonialQuote] = useState("");
  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");

  function handleCreateTestimonial() {
    startTransition(async () => {
      await createTestimonialAction(testimonialName, testimonialQuote);
      setTestimonialName("");
      setTestimonialQuote("");
      showToast("Testimonial added.");
      router.refresh();
    });
  }

  function handleDeleteTestimonial(id: string) {
    startTransition(async () => {
      await deleteTestimonialAction(id);
      showToast("Testimonial removed.");
      router.refresh();
    });
  }

  function handleCreateFaqItem() {
    startTransition(async () => {
      await createFaqItemAction(faqQuestion, faqAnswer);
      setFaqQuestion("");
      setFaqAnswer("");
      showToast("FAQ item added.");
      router.refresh();
    });
  }

  function handleDeleteFaqItem(id: string) {
    startTransition(async () => {
      await deleteFaqItemAction(id);
      showToast("FAQ item removed.");
      router.refresh();
    });
  }

  return (
    <main>
      <h1 className="font-heading mb-2 text-2xl text-foreground">Homepage content</h1>
      <p className="mb-8 text-sm text-muted">
        Manage the testimonials and FAQ shown on the homepage -- changes appear immediately, no code deploy needed.
      </p>

      <section aria-label="Testimonials" className="mb-12">
        <h2 className="font-heading mb-4 text-xl text-foreground">Testimonials</h2>
        <DataTable
          rowKey={(t) => t.id}
          rows={initialTestimonials}
          columns={[
            { header: "Name", cell: (t) => t.name },
            { header: "Quote", cell: (t) => t.quote },
            {
              header: "",
              cell: (t) => (
                <button type="button" onClick={() => handleDeleteTestimonial(t.id)} className="text-muted underline">
                  Remove
                </button>
              ),
            },
          ]}
          emptyMessage="No testimonials yet."
        />
        <div className="mt-6 flex flex-wrap items-end gap-2">
          <input
            placeholder="Customer name"
            value={testimonialName}
            onChange={(e) => setTestimonialName(e.target.value)}
            className="rounded-[var(--sf-radius,0.5rem)] border border-border px-3 py-2 text-sm"
          />
          <input
            placeholder="Quote"
            value={testimonialQuote}
            onChange={(e) => setTestimonialQuote(e.target.value)}
            className="min-w-[300px] flex-1 rounded-[var(--sf-radius,0.5rem)] border border-border px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={handleCreateTestimonial}
            disabled={isPending || !testimonialName || !testimonialQuote}
            className="rounded-[var(--sf-radius,0.5rem)] bg-brand px-4 py-2 text-sm font-medium uppercase text-brand-foreground disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </section>

      <section aria-label="FAQ">
        <h2 className="font-heading mb-4 text-xl text-foreground">FAQ</h2>
        <DataTable
          rowKey={(f) => f.id}
          rows={initialFaqItems}
          columns={[
            { header: "Question", cell: (f) => f.question },
            { header: "Answer", cell: (f) => f.answer },
            {
              header: "",
              cell: (f) => (
                <button type="button" onClick={() => handleDeleteFaqItem(f.id)} className="text-muted underline">
                  Remove
                </button>
              ),
            },
          ]}
          emptyMessage="No FAQ items yet."
        />
        <div className="mt-6 flex flex-wrap items-end gap-2">
          <input
            placeholder="Question"
            value={faqQuestion}
            onChange={(e) => setFaqQuestion(e.target.value)}
            className="min-w-[240px] rounded-[var(--sf-radius,0.5rem)] border border-border px-3 py-2 text-sm"
          />
          <input
            placeholder="Answer"
            value={faqAnswer}
            onChange={(e) => setFaqAnswer(e.target.value)}
            className="min-w-[300px] flex-1 rounded-[var(--sf-radius,0.5rem)] border border-border px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={handleCreateFaqItem}
            disabled={isPending || !faqQuestion || !faqAnswer}
            className="rounded-[var(--sf-radius,0.5rem)] bg-brand px-4 py-2 text-sm font-medium uppercase text-brand-foreground disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </section>
    </main>
  );
}
