"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

// Only fires for an error that escapes all the way past the root
// layout itself (a regular error.tsx boundary handles everything else)
// -- Next.js requires this to render its own <html>/<body> since the
// real root layout may be what threw. Also the one place a completely
// unhandled render error gets reported to Sentry, once configured (see
// docs/pending-actions.md) -- previously invisible entirely.
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main style={{ maxWidth: "32rem", margin: "6rem auto", padding: "0 1.5rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Something went wrong</h1>
          <p style={{ color: "#6B6B6B", marginBottom: "1.5rem" }}>
            We&apos;ve been notified and are looking into it. Please try again in a moment.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              borderRadius: "0.5rem",
              backgroundColor: "#C0504D",
              color: "#FFFFFF",
              padding: "0.625rem 1.5rem",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            Reload
          </button>
        </main>
      </body>
    </html>
  );
}
