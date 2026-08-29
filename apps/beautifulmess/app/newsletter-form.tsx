"use client";

import { useRef, useState, useTransition } from "react";
import { subscribeToNewsletter } from "../lib/newsletter-actions";

export function NewsletterForm() {
  const [error, setError] = useState<string | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await subscribeToNewsletter(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSubscribed(true);
      formRef.current?.reset();
    });
  }

  if (subscribed) {
    return <p className="mt-3 text-sm text-brand">Thanks for subscribing!</p>;
  }

  return (
    <>
      <form ref={formRef} action={handleSubmit} className="mt-3 flex border-b border-border pb-1">
        <input
          type="email"
          name="email"
          required
          placeholder="Email address"
          aria-label="Email address"
          disabled={isPending}
          className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted disabled:opacity-50"
        />
        <button type="submit" aria-label="Subscribe" disabled={isPending} className="-mr-2.5 p-2.5 text-brand disabled:opacity-50">
          &rarr;
        </button>
      </form>
      {error ? (
        <p className="mt-2 text-sm" style={{ color: "#B91C1C" }}>
          {error}
        </p>
      ) : null}
    </>
  );
}
