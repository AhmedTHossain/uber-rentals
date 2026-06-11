import { NextResponse } from "next/server";
import { runDailyJobs } from "@/lib/biz";

export const runtime = "nodejs";

/**
 * Scheduled daily-jobs endpoint. Intended to be triggered by an external
 * scheduler (Vercel Cron, pg_cron via http, a worker, or `ENABLE_NODE_CRON`).
 * Authenticated with CRON_SECRET — either `Authorization: Bearer <secret>`
 * (Vercel Cron's convention) or an `x-cron-secret` header.
 */
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  const x = req.headers.get("x-cron-secret");
  return auth === `Bearer ${secret}` || x === secret;
}

async function handle(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await runDailyJobs();
  return NextResponse.json({ ok: true, ...result });
}

export const POST = handle;
export const GET = handle;
