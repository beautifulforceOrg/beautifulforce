"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

// Catches a render/runtime error anywhere under the root layout, keeping
// the normal header/footer -- app/global-error.tsx is the fallback for
// the rarer case where the root layout itself throws. Reports to Sentry
// once configured (see docs/pending-actions.md); previously an
// unhandled error here just showed Next's default, unbranded overlay.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="mx-auto flex max-w-xl flex-col items-center px-6 py-24 text-center">
      <h1 className="font-heading text-3xl text-foreground">Something went wrong</h1>
      <p className="mt-4 text-sm text-muted">We&apos;ve been notified and are looking into it.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 rounded-[var(--sf-radius,0.5rem)] bg-brand px-6 py-2.5 text-sm font-medium uppercase text-brand-foreground"
      >
        Try again
      </button>
    </main>
  );
}
