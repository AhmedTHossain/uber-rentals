import { NextResponse } from "next/server";
import { isAvailable, today } from "@/lib/biz";
import { rateLimit, clientIp, tooMany } from "@/lib/rate-limit";

export const runtime = "nodejs";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const rl = rateLimit(`availability:${clientIp(req)}`, 60, 10 * 60 * 1000);
  if (!rl.ok) return tooMany(rl.retryAfter);

  const { id } = await params;
  const url = new URL(req.url);
  const start = url.searchParams.get("start") ?? "";
  const end = url.searchParams.get("end") ?? "";

  if (!DATE_RE.test(start) || !DATE_RE.test(end)) {
    return NextResponse.json({ error: "Provide valid start and end dates." }, { status: 422 });
  }
  if (end <= start) {
    return NextResponse.json({ error: "Return date must be after pick-up." }, { status: 422 });
  }
  if (start < today()) {
    return NextResponse.json({ error: "Pick-up date can't be in the past." }, { status: 422 });
  }

  const available = await isAvailable(id, start, end);
  return NextResponse.json({ available });
}
