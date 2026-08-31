"use client";

import { useState, useTransition } from "react";
import { adminLogIn } from "../../../lib/admin/actions";

export default function AdminLoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    setIsSubmitting(true);
    startTransition(() => {
      adminLogIn(formData)
        .then((result) => {
          if (result?.error) setError(result.error);
        })
        .finally(() => setIsSubmitting(false));
    });
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="font-heading mb-8 text-3xl uppercase text-foreground">Store admin</h1>
      <form action={handleSubmit} className="space-y-4">
        <input
          type="email"
          name="email"
          required
          placeholder="Email"
          className="w-full rounded-[var(--sf-radius,0.5rem)] border border-border px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted"
        />
        <input
          type="password"
          name="password"
          required
          placeholder="Password"
          className="w-full rounded-[var(--sf-radius,0.5rem)] border border-border px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted"
        />
        {error ? (
          <p style={{ color: "#B91C1C" }} className="text-sm">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-[var(--sf-radius,0.5rem)] bg-brand py-2.5 text-sm font-medium uppercase text-brand-foreground disabled:opacity-50"
        >
          {isSubmitting ? "Logging in..." : "Log in"}
        </button>
      </form>
    </main>
  );
}
