import * as Sentry from "@sentry/nextjs";

// No-op until SENTRY_DSN is actually set (see docs/pending-actions.md).
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
});
