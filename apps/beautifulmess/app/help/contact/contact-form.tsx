"use client";

import { useRef, useState, useTransition } from "react";
import { submitContactMessage } from "../../../lib/contact-actions";

export function ContactForm() {
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await submitContactMessage(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSubmitted(true);
      formRef.current?.reset();
    });
  }

  if (submitted) {
    return <p className="text-sm text-brand">Thanks for reaching out! We&apos;ll get back to you soon.</p>;
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <input
          type="text"
          name="name"
          required
          placeholder="Name"
          aria-label="Name"
          disabled={isPending}
          className="rounded-[var(--sf-radius,0.5rem)] border border-border px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted disabled:opacity-50"
        />
        <input
          type="email"
          name="email"
          required
          placeholder="Email"
          aria-label="Email"
          disabled={isPending}
          className="rounded-[var(--sf-radius,0.5rem)] border border-border px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted disabled:opacity-50"
        />
      </div>
      <input
        type="tel"
        name="phone"
        placeholder="Phone"
        aria-label="Phone"
        disabled={isPending}
        className="w-full rounded-[var(--sf-radius,0.5rem)] border border-border px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted disabled:opacity-50"
      />
      <textarea
        name="comment"
        rows={5}
        required
        placeholder="Comment"
        aria-label="Comment"
        disabled={isPending}
        className="w-full rounded-[var(--sf-radius,0.5rem)] border border-border px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted disabled:opacity-50"
      />
      {error ? (
        <p className="text-sm" style={{ color: "#B91C1C" }}>
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-[var(--sf-radius,0.5rem)] bg-brand px-6 py-3 text-sm font-medium uppercase text-brand-foreground disabled:opacity-50"
      >
        {isPending ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
}
