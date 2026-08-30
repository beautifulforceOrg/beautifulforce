"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { signUp } from "../../../lib/account-actions";

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    setIsSubmitting(true);
    startTransition(() => {
      signUp(formData)
        .then((result) => {
          if (result?.error) setError(result.error);
        })
        .finally(() => setIsSubmitting(false));
    });
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="font-heading mb-8 text-3xl uppercase text-foreground">Create an account</h1>
      <form action={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="name"
          placeholder="Name"
          className="w-full rounded-[var(--sf-radius,0.5rem)] border border-border px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted"
        />
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
          minLength={8}
          placeholder="Password (min. 8 characters)"
          className="w-full rounded-[var(--sf-radius,0.5rem)] border border-border px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted"
        />
        {error ? <p style={{ color: "#B91C1C" }} className="text-sm">{error}</p> : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-[var(--sf-radius,0.5rem)] bg-brand py-2.5 text-sm font-medium uppercase text-brand-foreground disabled:opacity-50"
        >
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>
      <p className="mt-6 text-sm text-muted">
        Already have an account?{" "}
        <Link href="/account/login" className="text-brand underline">
          Log in
        </Link>
      </p>
    </main>
  );
}
