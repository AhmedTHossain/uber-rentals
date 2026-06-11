import "server-only";

/**
 * Fails fast in production if known dev-placeholder secrets are still in use.
 * Imported by the DB client so it runs on every server boot.
 */
const DEV_PLACEHOLDERS: Record<string, string> = {
  AUTH_SECRET: "dev-secret-change-in-production-0a1b2c3d4e5f6071",
  CRON_SECRET: "dev-cron-secret-change-in-production",
};

// Enforce at runtime only — `next build` also runs as NODE_ENV=production and
// evaluates route modules, so skip the build phase.
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

if (process.env.NODE_ENV === "production" && !isBuildPhase) {
  const offenders: string[] = [];
  for (const [key, placeholder] of Object.entries(DEV_PLACEHOLDERS)) {
    if (process.env[key] === placeholder) offenders.push(key);
  }
  if (!process.env.AUTH_SECRET) offenders.push("AUTH_SECRET (missing)");
  if (offenders.length > 0) {
    throw new Error(
      `Refusing to start in production with insecure/missing secrets: ${offenders.join(", ")}. ` +
        `Set strong values in your environment.`,
    );
  }
  if ((process.env.STORAGE_DRIVER || "local") === "local") {
    console.warn(
      "[env] STORAGE_DRIVER=local in production — uploads are not durable on serverless. Use r2.",
    );
  }
}
