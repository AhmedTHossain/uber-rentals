/* eslint-disable no-console */
/**
 * Standalone daily-jobs worker for self-hosted / long-running deployments.
 * Runs as its own process (outside Next), so it doesn't touch the app bundle.
 * It triggers the scheduled-jobs endpoint on a cron schedule.
 *
 * Run with: npm run cron
 * Env: APP_URL (default http://localhost:3000), CRON_SECRET, CRON_SCHEDULE
 *      (default "0 6 * * *" — 06:00 daily).
 *
 * On serverless (Vercel) you don't need this — vercel.json crons hit the same
 * endpoint. pg_cron or any OS cron / scheduler can call it too.
 */
import "dotenv/config";
import cron from "node-cron";

const APP_URL = process.env.APP_URL || "http://localhost:3000";
const SECRET = process.env.CRON_SECRET || "";
const SCHEDULE = process.env.CRON_SCHEDULE || "0 6 * * *";

async function trigger() {
  try {
    const res = await fetch(`${APP_URL}/api/jobs/run-daily`, {
      method: "POST",
      headers: { "x-cron-secret": SECRET },
    });
    const body = await res.json().catch(() => ({}));
    console.log(`[cron ${new Date().toISOString()}] ${res.status}`, body);
  } catch (e) {
    console.error("[cron] trigger failed", e);
  }
}

if (!cron.validate(SCHEDULE)) {
  console.error(`Invalid CRON_SCHEDULE: ${SCHEDULE}`);
  process.exit(1);
}

cron.schedule(SCHEDULE, trigger);
console.log(`[cron] worker started — schedule "${SCHEDULE}", target ${APP_URL}/api/jobs/run-daily`);
console.log("[cron] press Ctrl+C to stop.");
