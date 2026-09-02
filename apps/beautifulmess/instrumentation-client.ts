import * as Sentry from "@sentry/nextjs";

// No-op until NEXT_PUBLIC_SENTRY_DSN is actually set (see
// docs/pending-actions.md) -- a separate NEXT_PUBLIC_ var since this
// file ships to the browser, unlike sentry.server.config.ts's
// server-only SENTRY_DSN.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
