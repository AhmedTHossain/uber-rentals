// Centralized error reporting. Isomorphic (safe on client + server).
//
// No-op-friendly scaffold: logs to console by default. To activate Sentry:
//   1) npm i @sentry/nextjs
//   2) create sentry.{client,server}.config and init with NEXT_PUBLIC_SENTRY_DSN
//   3) replace the console.error below with Sentry.captureException(error, { extra })
// The DSN gate means turning it on is purely config — call sites don't change.

const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

export function reportError(error: unknown, context?: Record<string, unknown>): void {
  if (DSN) {
    // Sentry hook goes here once the SDK is installed (see note above).
    // e.g. Sentry.captureException(error, context ? { extra: context } : undefined);
  }
  // Always keep a console trail (captured by Vercel/host log drains).
  console.error("[error]", error, context ?? "");
}
